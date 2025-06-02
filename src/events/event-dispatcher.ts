/**
 * 事件分发器 - 统一管理事件的分发和处理
 */

import { EventEmitter } from "events";
import { Client } from "@";
import { DataPacket } from "@/types";
import {ReceiverMode} from "@/receivers/base";
import {ApplicationPlatform} from "@/receivers/middleware";

export interface EventHandler<T = any> {
  (event: T): void | Promise<void>;
}

export interface EventMiddleware<T = any> {
  (event: T, next: () => Promise<void>): Promise<void>;
}

export interface EventMetadata {
  eventType: string;
  source: string;
  timestamp: number;
  processed: boolean;
}

/**
 * 事件分发器
 * 提供统一的事件处理、中间件支持和错误处理
 */
export class EventDispatcher<T extends ReceiverMode=ReceiverMode,M extends ApplicationPlatform=ApplicationPlatform> extends EventEmitter {
  private middlewares: Map<string, EventMiddleware[]> = new Map();
  private eventStats: Map<string, number> = new Map();
  private errorHandlers: Map<string, EventHandler<Error>[]> = new Map();

  constructor(private bot: Client<T,M>) {
    super();
    this.setupErrorHandling();
  }

  /**
   * 分发事件
   */
  async dispatch(eventName: string, packet: DataPacket): Promise<void> {
    try {
      // 更新事件统计
      this.updateEventStats(eventName);

      // 创建事件元数据
      const metadata: EventMetadata = {
        eventType: eventName,
        source: String(packet.s || 'unknown'),
        timestamp: Date.now(),
        processed: false
      };

      // 预处理事件数据
      const processedEvent = await this.preprocessEvent(eventName, packet);

      // 执行中间件链
      await this.executeMiddlewares(eventName, processedEvent, metadata);

      // 分发给具体的事件处理器
      await this.emitEvent(eventName, processedEvent, metadata);

      // 标记为已处理
      metadata.processed = true;

      this.bot.logger.debug(`[EVENT] 事件分发完成: ${eventName}`, {
        eventId: packet.id,
        timestamp: metadata.timestamp
      });

    } catch (error) {
      this.bot.logger.error(`[EVENT] 事件分发失败: ${eventName}`, error);
      await this.handleEventError(eventName, error as Error, packet);
    }
  }

  /**
   * 添加事件中间件
   */
  use(eventName: string, middleware: EventMiddleware): void {
    if (!this.middlewares.has(eventName)) {
      this.middlewares.set(eventName, []);
    }
    this.middlewares.get(eventName)!.push(middleware);
    this.bot.logger.debug(`[EVENT] 中间件已添加: ${eventName}`);
  }

  /**
   * 添加全局中间件（对所有事件生效）
   */
  useGlobal(middleware: EventMiddleware): void {
    this.use('*', middleware);
  }

  /**
   * 添加错误处理器
   */
  onError(eventName: string, handler: EventHandler<Error>): void {
    if (!this.errorHandlers.has(eventName)) {
      this.errorHandlers.set(eventName, []);
    }
    this.errorHandlers.get(eventName)!.push(handler);
  }

  /**
   * 添加全局错误处理器
   */
  onGlobalError(handler: EventHandler<Error>): void {
    this.onError('*', handler);
  }

  /**
   * 获取事件统计信息
   */
  getEventStats(): Map<string, number> {
    return new Map(this.eventStats);
  }

  /**
   * 重置事件统计
   */
  resetEventStats(): void {
    this.eventStats.clear();
  }

  /**
   * 预处理事件数据
   */
  private async preprocessEvent(eventName: string, packet: DataPacket): Promise<any> {
    // 根据事件类型进行特定的预处理
    switch (eventName) {
      case 'message.guild':
      case 'message.direct':
      case 'message.group':
      case 'message.c2c':
        return this.bot.processPayload(packet.id, eventName, packet.d);

      default:
        return packet.d;
    }
  }

  /**
   * 执行中间件链
   */
  private async executeMiddlewares(
    eventName: string,
    event: any,
    metadata: EventMetadata
  ): Promise<void> {
    // 获取全局中间件和特定事件的中间件
    const globalMiddlewares = this.middlewares.get('*') || [];
    const eventMiddlewares = this.middlewares.get(eventName) || [];
    const allMiddlewares = [...globalMiddlewares, ...eventMiddlewares];

    if (allMiddlewares.length === 0) return;

    // 创建中间件执行链
    let index = 0;
    const next = async (): Promise<void> => {
      if (index >= allMiddlewares.length) return;

      const middleware = allMiddlewares[index++];
      await middleware(event, next);
    };

    await next();
  }

  /**
   * 发出事件
   */
  private async emitEvent(eventName: string, event: any, metadata: EventMetadata): Promise<void> {
    // 同步触发事件
    this.emit(eventName, event, metadata);

    // 异步触发事件（如果有async监听器）
    const asyncEventName = `async:${eventName}`;
    if (this.listenerCount(asyncEventName) > 0) {
      setImmediate(() => {
        this.emit(asyncEventName, event, metadata);
      });
    }
  }

  /**
   * 更新事件统计
   */
  private updateEventStats(eventName: string): void {
    const current = this.eventStats.get(eventName) || 0;
    this.eventStats.set(eventName, current + 1);
  }

  /**
   * 处理事件错误
   */
  private async handleEventError(eventName: string, error: Error, packet: DataPacket): Promise<void> {
    // 触发特定事件的错误处理器
    const eventErrorHandlers = this.errorHandlers.get(eventName) || [];
    const globalErrorHandlers = this.errorHandlers.get('*') || [];
    const allErrorHandlers = [...eventErrorHandlers, ...globalErrorHandlers];

    for (const handler of allErrorHandlers) {
      try {
        await handler(error);
      } catch (handlerError) {
        this.bot.logger.error(`[EVENT] 错误处理器执行失败:`, handlerError);
      }
    }

    // 发出错误事件
    this.emit('error', {
      eventName,
      error,
      packet,
      timestamp: Date.now()
    });
  }

  /**
   * 设置基础错误处理
   */
  private setupErrorHandling(): void {
    // 处理未捕获的异常
    this.on('error', (errorInfo) => {
      this.bot.logger.error(`[EVENT] 未处理的事件错误:`, errorInfo);
    });

    // 添加默认的全局错误处理器
    this.onGlobalError((error) => {
      this.bot.logger.error(`[EVENT] 全局事件错误:`, error);
    });
  }

  /**
   * 创建事件过滤中间件
   */
  static createFilterMiddleware<T>(
    predicate: (event: T) => boolean,
    onFilter?: (event: T) => void
  ): EventMiddleware<T> {
    return async (event: T, next: () => Promise<void>) => {
      if (predicate(event)) {
        await next();
      } else if (onFilter) {
        onFilter(event);
      }
    };
  }

  /**
   * 创建事件转换中间件
   */
  static createTransformMiddleware<T>(
    transformer: (event: T) => T | Promise<T>
  ): EventMiddleware<T> {
    return async (event: T, next: () => Promise<void>) => {
      const transformedEvent = await transformer(event);
      Object.assign(event, transformedEvent);
      await next();
    };
  }

  /**
   * 创建事件日志中间件
   */
  static createLoggingMiddleware(
    logger: any,
    options: { level?: string; includeData?: boolean } = {}
  ): EventMiddleware {
    const { level = 'debug', includeData = false } = options;

    return async (event: any, next: () => Promise<void>) => {
      const start = Date.now();

      logger[level](`[EVENT] 开始处理事件`, {
        eventType: event.constructor?.name || 'unknown',
        data: includeData ? event : undefined
      });

      await next();

      const duration = Date.now() - start;
      logger[level](`[EVENT] 事件处理完成`, {
        duration: `${duration}ms`
      });
    };
  }

  /**
   * 创建速率限制中间件
   */
  static createRateLimitMiddleware(
    maxEvents: number,
    windowMs: number
  ): EventMiddleware {
    const eventCounts = new Map<string, { count: number; resetTime: number }>();

    return async (event: any, next: () => Promise<void>) => {
      const now = Date.now();
      const eventKey = event.user_id || event.guild_id || 'global';

      let eventData = eventCounts.get(eventKey);
      if (!eventData || now > eventData.resetTime) {
        eventData = { count: 0, resetTime: now + windowMs };
        eventCounts.set(eventKey, eventData);
      }

      if (eventData.count >= maxEvents) {
        throw new Error(`事件频率限制: ${eventKey} 超过 ${maxEvents} 次/${windowMs}ms`);
      }

      eventData.count++;
      await next();
    };
  }

  /**
   * 销毁事件分发器
   */
  destroy(): void {
    this.middlewares.clear();
    this.eventStats.clear();
    this.errorHandlers.clear();
    this.removeAllListeners();
    this.bot.logger.debug("[EVENT] 事件分发器已销毁");
  }
}
