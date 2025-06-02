/**
 * 表态服务类 - 负责所有表态相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { EmojiType } from '@/types'
import { User } from '@/entries/user'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class ReactionService {
    constructor(private bot: Bot) {}

    /**
     * 对频道消息进行表态
     */
    async addGuildMessageReaction(
        channelId: string, 
        messageId: string, 
        type: EmojiType, 
        id: `${number}`
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(`/channels/${channelId}/messages/${messageId}/reactions/${type}/${id}`)
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

    /**
     * 删除频道消息表态
     */
    async deleteGuildMessageReaction(
        channelId: string, 
        messageId: string, 
        type: EmojiType, 
        id: `${number}`
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}/messages/${messageId}/reactions/${type}/${id}`)
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

    /**
     * 获取表态用户列表
     */
    async getGuildMessageReactionMembers(
        channelId: string, 
        messageId: string, 
        type: EmojiType, 
        id: `${number}`
    ): Promise<ApiResponse<User.Info[]>> {
        try {
            const result = await this._getGuildMessageReactionMembers(channelId, messageId, type, id)
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
     * 私有方法：获取表态用户列表的实现
     */
    private async _getGuildMessageReactionMembers(
        channelId: string, 
        messageId: string, 
        type: EmojiType, 
        id: `${number}`,
        cookies?: string
    ): Promise<User.Info[]> {
        const formatUser = (users: any[]): User.Info[] => {
            return users.map(({ id, username, avatar, bot, public_flag }) => ({
                id,
                username,
                avatar,
                bot,
                public_flag
            }))
        }

        const {
            data: {
                users,
                cookie,
                is_end
            }
        } = await this.bot.request.get(`/channels/${channelId}/messages/${messageId}/reactions/${type}/${id}`, {
            params: {
                cookie: cookies
            }
        })

        if (is_end) return formatUser(users)
        return [...formatUser(users), ...await this._getGuildMessageReactionMembers(channelId, messageId, type, id, cookie)]
    }
}
