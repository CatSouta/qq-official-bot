/**
 * 消息构建器 - 专门负责构建消息内容
 */

import { Sendable, MessageElem, ImageElem, VideoElem, AudioElem } from "@/elements";
import { md5 } from "@/utils";
import { randomInt } from "crypto";

export interface MessagePayload {
  msg_seq: number;
  content: string;
  msg_type?: number;
  msg_id?: string;
  event_id?: string;
  message_reference?: {
    message_id: string;
  };
  image?: string;
  file_image?: any;
  media?: {
    file_info: any;
  };
  markdown?: any;
  keyboard?: any;
  bot_appid?: string;
  ark?: any;
  embed?: any;
}

export interface FilePayload {
  srv_send_msg: boolean;
  file_type?: number;
  file_data?: any;
}

export interface BuildResult {
  messagePayload: MessagePayload;
  filePayload: FilePayload;
  isFile: boolean;
  contentType: string;
  brief: string;
}

/**
 * 消息构建器
 * 专门负责将Sendable类型的消息转换为API所需的格式
 */
export class MessageBuilder {
  private messagePayload: MessagePayload;
  private filePayload: FilePayload;
  private buttons: any[] = [];
  private isFile = false;
  private contentType = 'application/json';
  private brief = '';

  constructor(
    private appid: string,
    private baseUrl: string,
    private source?: { id?: string; event_id?: string }
  ) {
    this.messagePayload = {
      msg_seq: randomInt(1, 1000000),
      content: ''
    };

    this.filePayload = {
      srv_send_msg: true
    };

    if (source?.id) {
      this.messagePayload.msg_id = source.id;
    }
  }

  /**
   * 构建消息
   */
  async build(message: Sendable): Promise<BuildResult> {
    await this.processMessage(message);
    await this.processButtons();

    return {
      messagePayload: this.messagePayload,
      filePayload: this.filePayload,
      isFile: this.isFile,
      contentType: this.contentType,
      brief: this.brief
    };
  }

  /**
   * 处理消息内容
   */
  private async processMessage(message: Sendable): Promise<void> {
    if (!Array.isArray(message)) {
      message = [message as any];
    }

    const messageQueue = [...message];

    while (messageQueue.length) {
      const elem = messageQueue.shift();
      
      if (typeof elem === 'string') {
        const parsedElems = this.parseFromTemplate(elem);
        messageQueue.unshift(...(parsedElems as any));
        continue;
      }

      await this.processElement(elem);
    }
  }

  /**
   * 处理单个消息元素
   */
  private async processElement(elem: MessageElem): Promise<void> {
    const { type, ...data } = elem;

    switch (type) {
      case 'reply':
        this.handleReply(elem as any);
        break;
      case 'at':
        this.handleAt(elem as any);
        break;
      case 'link':
        this.handleLink(elem as any);
        break;
      case 'text':
        this.handleText(elem as any);
        break;
      case 'face':
        this.handleFace(elem as any);
        break;
      case 'image':
      case 'audio':
      case 'video':
        await this.handleMedia(elem as ImageElem | VideoElem | AudioElem);
        break;
      case 'markdown':
        this.handleMarkdown(elem as any);
        break;
      case 'keyboard':
        this.handleKeyboard(elem as any);
        break;
      case 'button':
        this.handleButton(elem as any);
        break;
      case 'embed':
        this.handleEmbed(elem as any);
        break;
      case 'ark':
        this.handleArk(elem as any);
        break;
      default:
        console.warn(`未知的消息元素类型: ${type}`);
    }
  }

  /**
   * 处理回复元素
   */
  private handleReply(elem: { event_id?: string; id?: string }): void {
    if (elem.event_id) {
      this.messagePayload.event_id = elem.event_id;
      this.brief += `<reply,event_id=${elem.event_id}>`;
    } else if (elem.id) {
      this.messagePayload.msg_id = elem.id;
      this.messagePayload.message_reference = {
        message_id: elem.id
      };
      this.brief += `<reply,msg_id=${elem.id}>`;
    }
  }

  /**
   * 处理@元素
   */
  private handleAt(elem: { user_id: string | 'all' }): void {
    const userId = elem.user_id === 'all' ? 'everyone' : elem.user_id;
    this.messagePayload.content += `<@${userId}>`;
    this.brief += `<at,user=${userId}>`;
  }

  /**
   * 处理链接元素
   */
  private handleLink(elem: { channel_id: string }): void {
    this.messagePayload.content += `<#${elem.channel_id}>`;
    this.brief += `<link,channel=${elem.channel_id}>`;
  }

  /**
   * 处理文本元素
   */
  private handleText(elem: { text: string }): void {
    this.messagePayload.content += elem.text;
    this.brief += elem.text;
  }

  /**
   * 处理表情元素
   */
  private handleFace(elem: { id: number }): void {
    this.messagePayload.content += `<emoji:${elem.id}>`;
    this.brief += `<face,id=${elem.id}>`;
  }

  /**
   * 处理媒体元素（图片、视频、音频）
   */
  private async handleMedia(elem: ImageElem | VideoElem | AudioElem): Promise<void> {
    const mediaType = this.getMediaType(elem.type);
    
    // 如果是回复消息，需要特殊处理
    if (this.messagePayload.msg_id || this.messagePayload.event_id) {
      if (!this.baseUrl.startsWith('/v2')) {
        // 频道消息的文件处理
        const fileData = await this.prepareGuildMediaData(elem);
        if (typeof fileData !== 'string') {
          this.messagePayload.file_image = fileData;
        } else {
          this.messagePayload.image = elem.file as string;
        }
      } else {
        // 群聊/私聊消息的文件处理
        this.messagePayload.msg_type = 7;
        // 这里需要调用上传接口，暂时标记为需要文件上传
        this.isFile = true;
        this.filePayload.file_type = mediaType;
      }
    } else {
      // 非回复消息的处理
      if (!this.baseUrl.startsWith('/v2')) {
        const fileData = await this.prepareGuildMediaData(elem);
        if (typeof fileData !== 'string') {
          this.messagePayload.file_image = fileData;
        } else {
          this.messagePayload.image = elem.file as string;
        }
      } else {
        this.isFile = true;
        this.filePayload.file_type = mediaType;
      }
    }

    this.brief += `<${elem.type}:${this.getFileHash(elem.file)}>`;
  }

  /**
   * 处理Markdown元素
   */
  private handleMarkdown(elem: any): void {
    this.messagePayload.markdown = elem;
    this.messagePayload.msg_type = 2;
    const content = elem.content ? `content=${elem.content}` : `template_id=${elem.custom_template_id}`;
    this.brief += `<markdown,${content}>`;
  }

  /**
   * 处理键盘元素
   */
  private handleKeyboard(elem: any): void {
    this.messagePayload.msg_type = 2;
    this.messagePayload.keyboard = elem;
    this.messagePayload.bot_appid = this.appid;
    this.brief += `<keyboard>`;
  }

  /**
   * 处理按钮元素
   */
  private handleButton(elem: any): void {
    this.buttons.push(elem);
    this.brief += `<button,data=${JSON.stringify(elem)}>`;
  }

  /**
   * 处理嵌入元素
   */
  private handleEmbed(elem: any): void {
    if (this.baseUrl.startsWith('/v2')) return;
    this.messagePayload.msg_type = 4;
    this.messagePayload.embed = elem;
    this.brief += `<embed>`;
  }

  /**
   * 处理ARK元素
   */
  private handleArk(elem: any): void {
    this.messagePayload.msg_type = 3;
    this.messagePayload.ark = elem;
    this.brief += `<ark>`;
  }

  /**
   * 处理按钮组
   */
  private async processButtons(): Promise<void> {
    if (this.buttons.length === 0) return;

    const rows = [];
    let row = [];

    for (let i = 0; i < this.buttons.length; i++) {
      if (row.length >= 5) {
        rows.push(row);
        row = [];
      }

      if (Array.isArray(this.buttons[i].buttons)) {
        rows.push(this.buttons[i].buttons);
        continue;
      }

      row.push(this.buttons[i]);
    }

    if (row.length > 0) {
      rows.push(row);
    }

    this.messagePayload.keyboard = {
      content: {
        rows: rows.map(row => ({
          buttons: row
        }))
      },
      bot_appid: this.appid
    };
  }

  /**
   * 从模板字符串解析消息元素
   */
  private parseFromTemplate(template: string): MessageElem[] {
    const result = [];
    const reg = /(<[^>]+>)/;

    while (template.length) {
      const [match] = template.match(reg) || [];
      if (!match) {
        if (template) {
          result.push({
            type: 'text',
            text: template
          });
        }
        break;
      }

      const index = template.indexOf(match);
      const prevText = template.slice(0, index);
      
      if (prevText) {
        result.push({
          type: 'text',
          text: prevText
        });
      }

      template = template.slice(index + match.length);
      const [type, ...attrArr] = match.slice(1, -1).split(',');
      const attrs = Object.fromEntries(attrArr.map((attr: string) => {
        const [key, value] = attr.split('=');
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, value];
        }
      }));

      result.push({
        type,
        ...attrs
      });
    }

    return result;
  }

  /**
   * 准备频道媒体数据
   */
  private async prepareGuildMediaData(elem: ImageElem | VideoElem | AudioElem): Promise<any> {
    if ('url' in elem && elem.url) return elem.url;
    
    if (typeof elem.file === "string" && elem.file.startsWith('http')) {
      return elem.file;
    }

    this.contentType = 'multipart/form-data';

    if (Buffer.isBuffer(elem.file)) {
      return new Blob([elem.file]);
    } else if (typeof elem.file !== "string") {
      throw new Error("无效的文件参数: " + elem.file);
    } else if (elem.file.startsWith("base64://")) {
      return new Blob([Buffer.from(elem.file.slice(9), 'base64')]);
    } else if (/^data:[^/]+\/[^;]+;base64,/.test(elem.file)) {
      return new Blob([Buffer.from(elem.file.replace(/^data:[^/]+\/[^;]+;base64,/, ''), 'base64')]);
    } else {
      try {
        const fs = require('node:fs/promises');
        return new Blob([await fs.readFile(elem.file.replace("file://", ""))]);
      } catch {
        throw new Error("无效的文件路径: " + elem.file);
      }
    }
  }

  /**
   * 获取媒体类型编号
   */
  private getMediaType(type: string): 1 | 2 | 3 {
    return (['image', 'video', 'audio'].indexOf(type) + 1) as 1 | 2 | 3;
  }

  /**
   * 获取文件哈希值
   */
  private getFileHash(file: string | Buffer): string {
    try {
      return md5(file);
    } catch {
      return 'unknown';
    }
  }
}
