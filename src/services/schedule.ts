/**
 * 日程服务类 - 负责所有日程相关的API操作
 */
import { AxiosResponse } from 'axios'
import { Bot } from '@/bot'
import { ScheduleInfo, RemindType } from '@/types'

// 定义 API 响应类型
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

export class ScheduleService {
    constructor(private bot: Bot) {}

    /**
     * 获取频道日程列表
     */
    async getChannelSchedules(channelId: string, since?: number): Promise<ApiResponse<ScheduleInfo[]>> {
        try {
            const { data } = await this.bot.request.get(`/channels/${channelId}/schedules`, {
                params: since ? { since } : {}
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
     * 获取频道日程详情
     */
    async getChannelSchedule(channelId: string, scheduleId: string): Promise<ApiResponse<ScheduleInfo>> {
        try {
            const { data } = await this.bot.request.get(`/channels/${channelId}/schedules/${scheduleId}`)
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
     * 创建频道日程
     */
    async createChannelSchedule(
        channelId: string,
        name: string,
        description: string,
        startTimestamp: number,
        endTimestamp: number,
        jumpChannelId?: string,
        remindType: RemindType = 0
    ): Promise<ApiResponse<ScheduleInfo>> {
        try {
            const { data } = await this.bot.request.post(`/channels/${channelId}/schedules`, {
                schedule: {
                    name,
                    description,
                    start_timestamp: `${startTimestamp}`,
                    end_timestamp: `${endTimestamp}`,
                    jump_channel_id: jumpChannelId,
                    remind_type: `${remindType}`
                }
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
     * 修改频道日程
     */
    async updateChannelSchedule(
        channelId: string,
        scheduleId: string,
        name: string,
        description: string,
        startTimestamp: number,
        endTimestamp: number,
        jumpChannelId?: string,
        remindType: RemindType = 0
    ): Promise<ApiResponse<ScheduleInfo>> {
        try {
            const { data } = await this.bot.request.patch(`/channels/${channelId}/schedules/${scheduleId}`, {
                schedule: {
                    name,
                    description,
                    start_timestamp: `${startTimestamp}`,
                    end_timestamp: `${endTimestamp}`,
                    jump_channel_id: jumpChannelId,
                    remind_type: `${remindType}`
                }
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
     * 删除日程
     */
    async deleteChannelSchedule(channelId: string, scheduleId: string): Promise<ApiResponse<any>> {
        try {
            const { data } = await this.bot.request.delete(`/channels/${channelId}/schedules/${scheduleId}`)
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
}
