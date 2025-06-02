/**
 * 音频服务类 - 负责所有音频相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { AudioControl } from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class AudioService {
    constructor(private bot: Bot) {}

    /**
     * 音频控制
     */
    async controlChannelAudio(channelId: string, audioControl: AudioControl): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.post(`/channels/${channelId}/audio`, audioControl)
            return {
                success: true,
                data: result.status === 200
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

    /**
     * 上麦
     */
    async setOnlineMic(channelId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(`/channels/${channelId}/mic`)
            return {
                success: true,
                data: result.status === 200
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

    /**
     * 下麦
     */
    async setOfflineMic(channelId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}/mic`)
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
