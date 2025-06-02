/**
 * 成员服务类 - 负责所有成员相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { GuildMember } from '@/entries/guildMember'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class MemberService {
    constructor(private bot: Bot) {}

    /**
     * 获取频道成员列表
     */
    async getGuildMemberList(guildId: string): Promise<ApiResponse<GuildMember.ApiInfo[]>> {
        try {
            const result = await this._getGuildMemberList(guildId)
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
     * 获取频道成员信息
     */
    async getGuildMemberInfo(guildId: string, memberId: string): Promise<ApiResponse<GuildMember.ApiInfo>> {
        try {
            const { data: { user: { id: member_id, ...member }, roles, joined_at, nick } } =
                await this.bot.request.get(`/guilds/${guildId}/members/${memberId}`)

            const result: GuildMember.ApiInfo = {
                member_id,
                card: nick,
                roles,
                ...member,
                join_time: new Date(joined_at).getTime() / 1000,
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
     * 批量禁言频道成员
     */
    async muteMembers(
        guildId: string, 
        memberIds: string[], 
        seconds: number, 
        endTime?: number
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(`/guilds/${guildId}/mute`, {
                mute_seconds: `${seconds}`,
                mute_end_timestamp: `${endTime}`,
                user_ids: memberIds
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
     * 批量取消频道成员禁言
     */
    async unmuteMembers(guildId: string, memberIds: string[]): Promise<ApiResponse<boolean>> {
        try {
            return await this.muteMembers(guildId, memberIds, 0, 0)
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
     * 添加频道成员角色
     */
    async addMemberRole(
        guildId: string, 
        channelId: string, 
        memberId: string, 
        roleId: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.put(
                `/guilds/${guildId}/members/${memberId}/roles/${roleId}`, 
                { id: channelId }
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
     * 移除频道成员角色
     */
    async removeMemberRole(
        guildId: string, 
        channelId: string, 
        memberId: string, 
        roleId: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(
                `/guilds/${guildId}/members/${memberId}/roles/${roleId}`, 
                { data: { id: channelId } }
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
     * 踢出频道成员
     */
    async kickMember(
        guildId: string, 
        memberId: string, 
        clean: -1 | 0 | 3 | 7 | 15 | 30 = 0, 
        blacklist?: boolean
    ): Promise<ApiResponse<boolean>> {
        try {
            const result = await this.bot.request.delete(`/guilds/${guildId}/members/${memberId}`, {
                data: {
                    add_blacklist: blacklist,
                    delete_message_days: clean
                }
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
     * 私有方法：获取频道成员列表的实现
     */
    private async _getGuildMemberList(guildId: string, after?: string): Promise<GuildMember.ApiInfo[]> {
        const res = await this.bot.request.get(`/guilds/${guildId}/members`, {
            params: {
                after,
                limit: 100
            }
        }).catch(() => ({ data: [] })) // 公域没有权限，做个兼容

        if (!res.data?.length) return []

        const result = (res.data || []).map(m => {
            const { user: { id: member_id, ...member }, roles, joined_at, nick } = m
            return {
                member_id,
                card: nick,
                roles,
                ...member,
                join_time: new Date(joined_at).getTime() / 1000,
            }
        })

        const last = result[result.length - 1]
        if (result.length < 100) return result
        return [...result, ...await this._getGuildMemberList(guildId, last.member_id)]
    }
}
