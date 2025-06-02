/**
 * 机器人服务类 - 负责机器人基础信息和操作相关的API
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { ActionNoticeEvent } from '@/events/notice'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class BotService {
    constructor(private bot: Bot) {}

    /**
     * 获取机器人信息
     */
    async getSelfInfo(): Promise<ApiResponse<Bot.Info>> {
        try {
            const { data: result } = await this.bot.request.get<Bot.Info>('/users/@me')
            return { success: true, data: result }
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
     * 回应操作
     */
    async replyAction(actionId: string, code: ActionNoticeEvent.ReplyCode = 0): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(`/interactions/${actionId}`, { code })
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
}
