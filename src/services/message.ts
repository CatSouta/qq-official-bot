/**
 * 消息服务类 - 负责所有消息相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { GuildMessageEvent, PrivateMessageEvent } from '@/events'
import { Sendable, Quotable } from '@/elements'
import { MessageSender } from '@/message'
import { DMS } from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class MessageService {
    constructor(private bot: Bot) {}

    /**
     * 获取子频道消息
     */
    async getGuildMessage(channelId: string, messageId: string): Promise<ApiResponse<GuildMessageEvent>> {
        try {
            const { data: result } = await this.bot.request.get(`/channels/${channelId}/messages/${messageId}`)
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
     * 发送频道消息
     */
    async sendGuildMessage(channelId: string, message: Sendable, source?: Quotable): Promise<ApiResponse<any>> {
        try {
            const messageSender = new MessageSender(this.bot, `/channels/${channelId}`, source);
            const result = await messageSender.send(message);
            this.bot.logger.info(`send to Channel(${channelId}): ${await messageSender.getBrief(message)}`);
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
     * 撤回频道消息
     */
    async recallGuildMessage(channelId: string, messageId: string, hideWarning: boolean = false): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}/messages/${messageId}`, {
                data: hideWarning ? { hidetip: true } : undefined
            })
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
     * 创建私信会话
     */
    async createDirectSession(guildId: string, userId: string): Promise<ApiResponse<DMS>> {
        try {
            const { data: result } = await this.bot.request.post(`/users/@me/dms`, {
                recipient_id: userId,
                source_guild_id: guildId
            })
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
     * 发送频道私信
     */
    async sendDirectMessage(guildId: string, message: Sendable, source?: Quotable): Promise<ApiResponse<any>> {
        try {
            const messageSender = new MessageSender(this.bot, `/dms/${guildId}`, source);
            const result = await messageSender.send(message);
            this.bot.logger.info(`send to DM(${guildId}): ${await messageSender.getBrief(message)}`);
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
     * 获取频道私信
     */
    async getDirectMessage(guildId: string, messageId: string): Promise<ApiResponse<PrivateMessageEvent>> {
        try {
            const { data: result } = await this.bot.request.get(`/dms/${guildId}/messages/${messageId}`)
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
     * 发送私聊消息
     */
    async sendPrivateMessage(userId: string, message: Sendable, source?: Quotable): Promise<ApiResponse<any>> {
        try {
            const messageSender = new MessageSender(this.bot, `/v2/users/${userId}`, source);
            const result = await messageSender.send(message);
            this.bot.logger.info(`send to User(${userId}): ${await messageSender.getBrief(message)}`);
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
     * 撤回私聊消息
     */
    async recallPrivateMessage(userId: string, messageId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/v2/users/${userId}/messages/${messageId}`)
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
     * 发送群消息
     */
    async sendGroupMessage(groupId: string, message: Sendable, source?: Quotable): Promise<ApiResponse<any>> {
        try {
            const messageSender = new MessageSender(this.bot, `/v2/groups/${groupId}`, source);
            const result = await messageSender.send(message);
            this.bot.logger.info(`send to Group(${groupId}): ${await messageSender.getBrief(message)}`);
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
     * 撤回群消息
     */
    async recallGroupMessage(groupId: string, messageId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/v2/groups/${groupId}/messages/${messageId}`)
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
