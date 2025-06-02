/**
 * 文件处理器 - 专门负责文件上传和处理
 */

import { Client } from "@/client";
import { getFileBase64 } from "@/utils/file";
import {ReceiverMode} from "@/receivers/base";
import {ApplicationPlatform} from "@/receivers/middleware";

export interface FileUploadResult {
  file_info: any;
  url?: string;
  file_id?: string;
}

export interface UploadOptions {
  targetId: string;
  targetType: 'user' | 'group';
  fileType: 1 | 2 | 3; // 1: image, 2: video, 3: audio
  sendMessage?: boolean;
}

/**
 * 文件处理器
 * 专门负责文件的上传、处理和管理
 */
export class FileProcessor<T extends ReceiverMode=ReceiverMode,M extends ApplicationPlatform=ApplicationPlatform> {
  constructor(private bot: Client<T,M>) {}

  /**
   * 上传媒体文件
   */
  async uploadMedia(
    fileData: string | Buffer,
    options: UploadOptions
  ): Promise<FileUploadResult> {
    try {
      // 转换文件数据为base64格式
      const base64Data = await getFileBase64(fileData);

      // 构建上传请求
      const uploadPayload = {
        file_type: options.fileType,
        file_data: base64Data,
        srv_send_msg: options.sendMessage || false
      };

      // 发送上传请求
      const { data: result } = await this.bot.request.post(
        `/v2/${options.targetType}s/${options.targetId}/files`,
        uploadPayload
      );

      this.bot.logger.debug("[FILE] 文件上传成功", {
        targetId: options.targetId,
        targetType: options.targetType,
        fileType: options.fileType,
        fileId: result.file_info?.file_id
      });

      return result;
    } catch (error) {
      this.bot.logger.error("[FILE] 文件上传失败:", error);
      throw new Error(`文件上传失败: ${error}`);
    }
  }

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(
    files: Array<{
      data: string | Buffer;
      type: 1 | 2 | 3;
    }>,
    options: Omit<UploadOptions, 'fileType'>
  ): Promise<FileUploadResult[]> {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.uploadMedia(file.data, {
          ...options,
          fileType: file.type
        });
        results.push(result);
      } catch (error) {
        this.bot.logger.error(`[FILE] 批量上传中的文件失败:`, error);
        // 可以选择抛出错误或继续处理其他文件
        throw error;
      }
    }

    return results;
  }

  /**
   * 检查文件类型
   */
  validateFileType(fileData: string | Buffer, expectedType: 1 | 2 | 3): boolean {
    // 这里可以添加文件类型验证逻辑
    // 例如检查文件头、扩展名等
    return true;
  }

  /**
   * 获取文件大小
   */
  getFileSize(fileData: string | Buffer): number {
    if (Buffer.isBuffer(fileData)) {
      return fileData.length;
    }

    if (typeof fileData === 'string') {
      if (fileData.startsWith('base64://')) {
        return Buffer.from(fileData.slice(9), 'base64').length;
      } else if (fileData.startsWith('data:')) {
        const base64Data = fileData.split(',')[1];
        return Buffer.from(base64Data, 'base64').length;
      }
    }

    return 0;
  }

  /**
   * 检查文件大小限制
   */
  checkFileSizeLimit(fileData: string | Buffer, maxSize: number = 10 * 1024 * 1024): boolean {
    const fileSize = this.getFileSize(fileData);
    return fileSize <= maxSize;
  }

  /**
   * 从URL下载文件
   */
  async downloadFromUrl(url: string): Promise<Buffer> {
    try {
      const axios = require('axios');
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024 // 10MB limit
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.bot.logger.error(`[FILE] 从URL下载文件失败: ${url}`, error);
      throw new Error(`下载文件失败: ${error}`);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    const fs = require('node:fs/promises');

    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        this.bot.logger.debug(`[FILE] 临时文件已清理: ${filePath}`);
      } catch (error) {
        this.bot.logger.warn(`[FILE] 清理临时文件失败: ${filePath}`, error);
      }
    }
  }
}
