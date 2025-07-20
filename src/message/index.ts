/**
 * 消息系统入口文件
 */
export { MessageBuilder } from './builder';
export { FileProcessor } from './file-processor';

export type { MessagePayload, FilePayload, BuildResult } from './builder';
export type { FileUploadResult, UploadOptions } from './file-processor';
