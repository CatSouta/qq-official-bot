/**
 * 子频道服务类 - 负责所有子频道相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Channel } from '@/entries/channel'
import { Bot } from '@/bot'
import { ChannelUpdateInfo, PinsMessage } from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class ChannelService {
    constructor(private bot: Bot) {}

    /**
     * 获取子频道列表
     */
    async getList(guildId: string): Promise<ApiResponse<Channel.ApiInfo[]>> {
        try {
            const { data: result = [] } = await this.bot.request.get(`/guilds/${guildId}/channels`)
            const formattedResult = result.map(({ id: channel_id, name: channel_name, ...channel }) => ({
                channel_id,
                channel_name,
                ...channel
            }))
            return { success: true, data: formattedResult }
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
     * 获取子频道信息
     */
    async getInfo(channelId: string): Promise<ApiResponse<Channel.ApiInfo>> {
        try {
            const {
                data: {
                    id: _,
                    name: channel_name,
                    ...channel
                }
            } = await this.bot.request.get<Channel.Info>(`/channels/${channelId}`)

            const result: Channel.ApiInfo = {
                channel_id: channelId,
                channel_name,
                ...channel
            }

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
     * 创建子频道
     */
    async create(guildId: string, channelInfo: Omit<Channel.Info, 'id'>): Promise<ApiResponse<Channel.Info>> {
        try {
            const { data: result } = await this.bot.request.post<
                Omit<Channel.Info, 'id'>, 
                AxiosResponse<Channel.Info>
            >(`/guilds/${guildId}/channels`, channelInfo)

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
     * 修改子频道
     */
    async update(channelId: string, updateInfo: ChannelUpdateInfo): Promise<ApiResponse<Channel.Info>> {
        try {
            const { data: result } = await this.bot.request.patch<
                ChannelUpdateInfo, 
                AxiosResponse<Channel.Info>
            >(`/channels/${channelId}`, updateInfo)

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
     * 删除子频道
     */
    async delete(channelId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}`)
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
     * 获取频道置顶消息id列表
     */
    async getPins(channelId: string): Promise<ApiResponse<string[]>> {
        try {
            const { data: { message_ids = [] } = {} } = await this.bot.request.get(`/channels/${channelId}/pins`)
            return { success: true, data: message_ids }
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
     * 置顶频道消息
     */
    async pinMessage(channelId: string, messageId: string): Promise<ApiResponse<PinsMessage>> {
        try {
            const { data: result } = await this.bot.request.post<PinsMessage>(`/channels/${channelId}/pins/${messageId}`)
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
     * 取消置顶频道消息
     */
    async unpinMessage(channelId: string, messageId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/channels/${channelId}/pins/${messageId}`)
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
