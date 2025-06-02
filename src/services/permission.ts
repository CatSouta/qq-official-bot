/**
 * 权限服务类 - 负责所有权限相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { 
    ChannelMemberPermissions, 
    ChannelRolePermissions, 
    UpdatePermissionParams,
    Announce
} from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class PermissionService {
    constructor(private bot: Bot) {}

    /**
     * 获取频道角色权限信息
     */
    async getChannelRolePermission(channelId: string, roleId: string): Promise<ApiResponse<ChannelRolePermissions>> {
        try {
            const { data: result } = await this.bot.request.get<ChannelRolePermissions>(
                `/channels/${channelId}/roles/${roleId}/permissions`
            )
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
     * 更新频道角色权限
     */
    async updateChannelRolePermission(
        channelId: string, 
        roleId: string, 
        permission: UpdatePermissionParams
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(
                `/channels/${channelId}/roles/${roleId}/permissions`, 
                permission
            )
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
     * 获取频道用户权限
     */
    async getChannelMemberPermission(channelId: string, memberId: string): Promise<ApiResponse<ChannelMemberPermissions>> {
        try {
            const { data: result } = await this.bot.request.get<ChannelMemberPermissions>(
                `/channels/${channelId}/members/${memberId}/permissions`
            )
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
     * 更新频道用户权限
     */
    async updateChannelMemberPermission(
        channelId: string, 
        memberId: string, 
        permission: UpdatePermissionParams
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(
                `/channels/${channelId}/members/${memberId}/permissions`, 
                permission
            )
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
     * 设置频道公告
     */
    async setChannelAnnounce(guildId: string, channelId: string, messageId: string): Promise<ApiResponse<Announce>> {
        try {
            const { data: result } = await this.bot.request.post<Announce>(
                `/guilds/${guildId}/announces`, 
                {
                    channel_id: channelId,
                    message_id: messageId
                }
            )
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
}
