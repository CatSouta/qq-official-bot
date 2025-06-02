/**
 * 消息系统入口文件
 */
export { MessageBuilder } from './builder';
export { FileProcessor } from './file-processor';
export { MessageSender } from './sender';

export type { MessagePayload, FilePayload, BuildResult } from './builder';
export type { FileUploadResult, UploadOptions } from './file-processor';
export type { SendOptions, SendResult } from './sender';
