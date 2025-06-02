/**
 * 帖子服务类 - 负责所有帖子相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { Thread, ThreadInfo } from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class ThreadService {
    constructor(private bot: Bot) {}

    /**
     * 获取频道帖子列表
     */
    async getChannelThreads(channelId: string): Promise<ApiResponse<Thread[]>> {
        try {
            const { data } = await this.bot.request.get(`/channels/${channelId}/threads`)
            return { success: true, data }
        } catch (error) {
            return {
                success: false,
                error: {
                    code: error.status || 500,
                    message: error.message
                }
            }
        }
    }

    /**
     * 获取频道帖子详情
     */
    async getChannelThreadInfo(channelId: string, threadId: string): Promise<ApiResponse<ThreadInfo>> {
        try {
            const { data } = await this.bot.request.get(`/channels/${channelId}/threads/${threadId}`)
            return { success: true, data }
        } catch (error) {
            return {
                success: false,
                error: {
                    code: error.status || 500,
                    message: error.message
                }
            }
        }
    }

    /**
     * 创建频道帖子
     */
    async publishThread(
        channelId: string,
        title: string,
        content: string,
        format: 1 | 2 | 3 | 4 = 3
    ): Promise<ApiResponse<ThreadInfo>> {
        try {
            const { data } = await this.bot.request.post(`/channels/${channelId}/threads`, {
                title,
                content,
                format
            })
            return { success: true, data }
        } catch (error) {
            return {
                success: false,
                error: {
                    code: error.status || 500,
                    message: error.message
                }
            }
        }
    }

    /**
     * 删除频道帖子
     */
    async deleteThread(channelId: string, threadId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}/threads/${threadId}`)
            return {
                success: true,
                data: result.status === 204
            }
        } catch (error) {
            return {
                success: false,
                error: {
                    code: error.status || 500,
                    message: error.message
                }
            }
        }
    }
}
