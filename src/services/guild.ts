/**
 * 频道服务类 - 负责所有频道相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Guild } from '@'
import { Bot } from '@'
import {
    RoleCreateParam,
    RoleUpdateParam,
    ApiBaseInfo,
    ApiPermissionDemand
} from '@'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class GuildService {
    constructor(private bot: Bot) {}

    /**
     * 获取频道列表
     */
    async getList(): Promise<ApiResponse<Guild.ApiInfo[]>> {
        try {
            const result = await this._getGuildList()
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
     * 获取频道信息
     */
    async getInfo(guildId: string): Promise<ApiResponse<Guild.ApiInfo>> {
        try {
            const { data: { id: _, name: guild_name, joined_at, ...guild } } =
                await this.bot.request.get(`/guilds/${guildId}`)

            const result: Guild.ApiInfo = {
                guild_id: guildId,
                guild_name,
                join_time: new Date(joined_at).getTime() / 1000,
                ...guild
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
     * 频道禁言
     */
    async mute(guildId: string, seconds: number, endTime?: number): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(`/guilds/${guildId}/mute`, {
                mute_seconds: `${seconds}`,
                mute_end_timestamp: `${endTime || 0}`
            })

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
     * 取消频道禁言
     */
    async unmute(guildId: string): Promise<ApiResponse<boolean>> {
        return this.mute(guildId, 0, 0)
    }

    /**
     * 获取频道角色列表
     */
    async getRoles(guildId: string): Promise<ApiResponse<Guild.Role[]>> {
        try {
            const { data: { roles = [] } = {} } =
                await this.bot.request.get<{ roles: Guild.Role[] }>(`/guilds/${guildId}/roles`)

            return { success: true, data: roles }
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
     * 创建频道角色
     */
    async createRole(guildId: string, role: RoleCreateParam): Promise<ApiResponse<Guild.Role>> {
        try {
            const { data: { role: result } } = await this.bot.request.post<
                RoleCreateParam,
                AxiosResponse<{ role: Guild.Role }>
            >(`/guilds/${guildId}/roles`, role)

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
     * 更新频道角色
     */
    async updateRole(
        guildId: string,
        roleId: string,
        updateInfo: RoleUpdateParam
    ): Promise<ApiResponse<Guild.Role>> {
        try {
            const { data: { role: result } } = await this.bot.request.patch<
                RoleUpdateParam,
                AxiosResponse<{ role: Guild.Role }>
            >(`/guilds/${guildId}/roles/${roleId}`, updateInfo)

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
     * 删除频道角色
     */
    async deleteRole(roleId: string): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/guilds/{guild_id}/roles/${roleId}`)
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
     * 获取频道可访问API类别
     */
    async getAccessApis(guildId: string): Promise<ApiResponse<ApiPermissionDemand[]>> {
        try {
            const { data: { apis = [] } } = await this.bot.request.get<{
                apis: ApiPermissionDemand[]
            }>(`/guilds/${guildId}/api_permission`)

            return { success: true, data: apis }
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
     * 申请频道API权限
     */
    async applyAccess(
        guildId: string,
        channelId: string,
        apiInfo: ApiBaseInfo,
        desc?: string
    ): Promise<ApiResponse<ApiPermissionDemand>> {
        try {
            const { data: result } = await this.bot.request.post<{
                channel_id: string
                api_identify: ApiBaseInfo
                desc: string
            }, AxiosResponse<ApiPermissionDemand>>(`/guilds/${guildId}/api_permission/demand`, {
                channel_id: channelId,
                api_identify: apiInfo,
                desc,
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
     * 私有方法：获取频道列表的实现
     */
    private async _getGuildList(after?: string): Promise<Guild.ApiInfo[]> {
        const res = await this.bot.request.get('/users/@me/guilds', {
            params: { after }
        }).catch(() => ({ data: [] })) // 私域不支持获取频道列表，做个兼容

        if (!res.data?.length) return []

        const result = (res.data || []).map(g => {
            const { id: guild_id, name: guild_name, joined_at, ...guild } = g
            return {
                guild_id,
                guild_name,
                join_time: new Date(joined_at).getTime() / 1000,
                ...guild
            }
        })

        const last = result[result.length - 1]
        if (result.length === 100) { // 如果返回了100条，可能还有更多
            const nextResults = await this._getGuildList(last.guild_id)
            return [...result, ...nextResults]
        }

        return result
    }
}
