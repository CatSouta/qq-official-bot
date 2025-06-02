/**
 * 消息发送器 - 专门负责消息的发送逻辑
 */

import { Client } from "@/client";
import { Sendable, Quotable } from "@/elements";
import { Message } from "@/message/parser";
import { MessageBuilder, BuildResult } from "./builder";
import { FileProcessor } from "./file-processor";
import { MessageAuditEvent } from "@/events";
import {ReceiverMode} from "@/receivers/base";
import {ApplicationPlatform} from "@/receivers/middleware";

export interface SendOptions {
  quote?: boolean;
  timeout?: number;
  retries?: number;
}

export interface SendResult {
  id: string;
  timestamp: number;
  [key: string]: any;
}

/**
 * 消息发送器
 * 专门负责消息的发送、审核处理和结果返回
 */
export class MessageSender<T extends ReceiverMode=ReceiverMode,M extends ApplicationPlatform=ApplicationPlatform> {
  private messageBuilder: MessageBuilder;
  private fileProcessor: FileProcessor;
  private apiBaseUrl: string;

  constructor(
    private bot: Client<T,M>,
    private endpointPath: string,
    private source?: Quotable
  ) {
    this.apiBaseUrl = bot.config.sandbox ? 'https://sandbox.api.sgroup.qq.com' : 'https://api.sgroup.qq.com';

    this.messageBuilder = new MessageBuilder(
      bot.config.appid,
      this.apiBaseUrl,
      source
    );
    this.fileProcessor = new FileProcessor(bot);
  }

  /**
   * 发送消息
   */
  async send(message: Sendable, options: SendOptions = {}): Promise<SendResult> {
    try {
      // 构建消息
      const buildResult = await this.messageBuilder.build(message);

      // 记录发送日志
      this.bot.logger.info(`[SENDER] 发送消息到 ${this.endpointPath}: ${buildResult.brief}`);

      // 处理文件发送
      if (buildResult.isFile) {
        return await this.sendFile(buildResult);
      }

      // 发送普通消息
      return await this.sendMessage(buildResult, options);

    } catch (error) {
      this.bot.logger.error(`[SENDER] 消息发送失败:`, error);
      throw error;
    }
  }

  /**
   * 发送文件消息
   */
  private async sendFile(buildResult: BuildResult): Promise<SendResult> {
    try {
      const { data: result } = await this.bot.request.post<Message.FileInfo>(
        this.endpointPath + '/files',
        buildResult.filePayload
      );

      return {
        id: result.file_uuid || '',
        timestamp: Date.now() / 1000,
        ...result
      };
    } catch (error) {
      this.bot.logger.error("[SENDER] 文件发送失败:", error);
      throw new Error(`文件发送失败: ${error}`);
    }
  }

  /**
   * 发送普通消息
   */
  private async sendMessage(buildResult: BuildResult, options: SendOptions): Promise<SendResult> {
    try {
      const { data: result } = await this.bot.request.post<Message.MessageRet | Message.Audit>(
        this.endpointPath + '/messages',
        buildResult.messagePayload,
        {
          headers: {
            'Content-Type': buildResult.contentType
          },
          timeout: options.timeout || 10000
        }
      );

      // 检查是否需要审核
      if (this.isAuditResult(result)) {
        this.bot.logger.info(`[SENDER] 消息需要审核: ${result.message_audit.audit_id}`);
        return await this.waitForAudit(result.message_audit.audit_id);
      }

      // 处理正常发送结果
      const messageResult = result as Message.MessageRet;
      return {
        id: messageResult.id,
        timestamp: new Date(messageResult.timestamp).getTime() / 1000,
        ...messageResult
      };

    } catch (error) {
      this.bot.logger.error("[SENDER] 消息发送失败:", error);
      throw new Error(`消息发送失败: ${error}`);
    }
  }

  /**
   * 等待审核结果
   */
  private async waitForAudit(auditId: string): Promise<SendResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.bot.off('message_audit.pass', onPass);
        this.bot.off('message_audit.reject', onReject);
        reject(new Error('审核超时'));
      }, 30000); // 30秒超时

      const onPass = (event: MessageAuditEvent) => {
        if (event.audit_id === auditId) {
          clearTimeout(timeout);
          this.bot.off('message_audit.pass', onPass);
          this.bot.off('message_audit.reject', onReject);

          resolve({
            id: event.message_id || '',
            timestamp: Date.now() / 1000,
            audit_id: auditId,
            audit_status: 'passed'
          });
        }
      };

      const onReject = (event: MessageAuditEvent) => {
        if (event.audit_id === auditId) {
          clearTimeout(timeout);
          this.bot.off('message_audit.pass', onPass);
          this.bot.off('message_audit.reject', onReject);

          reject(new Error(`消息审核被拒绝: ${event.audit_time}`));
        }
      };

      this.bot.on('message_audit.pass', onPass);
      this.bot.on('message_audit.reject', onReject);
    });
  }

  /**
   * 检查是否为审核结果
   */
  private isAuditResult(result: any): result is Message.Audit {
    return result && typeof result === 'object' && 'message_audit' in result;
  }

  /**
   * 发送带引用的消息
   */
  async sendWithQuote(message: Sendable, quote?: Quotable, options: SendOptions = {}): Promise<SendResult> {
    if (quote) {
      // 创建新的MessageBuilder实例以包含引用信息
      const quotedBuilder = new MessageBuilder(
        this.bot.config.appid,
        this.apiBaseUrl,
        quote
      );

      const buildResult = await quotedBuilder.build(message);

      if (buildResult.isFile) {
        return await this.sendFile(buildResult);
      }

      return await this.sendMessage(buildResult, options);
    }

    return await this.send(message, options);
  }

  /**
   * 批量发送消息
   */
  async sendBatch(messages: Sendable[], options: SendOptions = {}): Promise<SendResult[]> {
    const results = [];

    for (const message of messages) {
      try {
        const result = await this.send(message, options);
        results.push(result);

        // 添加发送间隔以避免频率限制
        await this.delay(100);
      } catch (error) {
        this.bot.logger.error(`[SENDER] 批量发送中的消息失败:`, error);
        // 可以选择继续发送其他消息或停止
        throw error;
      }
    }

    return results;
  }

  /**
   * 重试发送消息
   */
  async sendWithRetry(message: Sendable, maxRetries: number = 3, options: SendOptions = {}): Promise<SendResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.send(message, options);
      } catch (error) {
        lastError = error as Error;
        this.bot.logger.warn(`[SENDER] 发送失败，尝试重试 (${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          // 指数退避策略
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`消息发送失败，已重试 ${maxRetries} 次: ${lastError.message}`);
  }

  /**
   * 获取发送摘要信息
   */
  async getBrief(message: Sendable): Promise<string> {
    const buildResult = await this.messageBuilder.build(message);
    return buildResult.brief;
  }

  /**
   * 工具方法：延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
