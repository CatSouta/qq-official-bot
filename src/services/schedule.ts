/**
 * 日程服务类 - 负责所有日程相关的API操作
 */
import { AxiosInstance } from 'axios'
import { ScheduleInfo } from '@/types'

export class ScheduleService {
    constructor(private request: AxiosInstance) {}

    /**
     * 获取频道日程列表
     */
    async getChannelSchedules(channelId: string, since?: number): Promise<ScheduleInfo[]> {
        const { data } = await this.request.get(`/channels/${channelId}/schedules`, {
            params: since ? { since } : {}
        })
        return data
    }

    /**
     * 获取频道日程详情
     */
    async getChannelSchedule(channelId: string, scheduleId: string): Promise<ScheduleInfo> {
        const { data } = await this.request.get(`/channels/${channelId}/schedules/${scheduleId}`)
        return data
    }

    /**
     * 创建频道日程
     */
    async createChannelSchedule(
        channelId: string,
        schedule: Exclude<ScheduleInfo, 'id'>
    ): Promise<ScheduleInfo> {
        const { data } = await this.request.post(`/channels/${channelId}/schedules`, { schedule })
        return data
    }

    /**
     * 修改频道日程
     */
    async updateChannelSchedule(
        channelId: string,
        scheduleId: string,
        schedule: Exclude<ScheduleInfo, 'id'>
    ): Promise<ScheduleInfo> {
        const { data } = await this.request.patch(`/channels/${channelId}/schedules/${scheduleId}`, { schedule })
        return data
    }

    /**
     * 删除日程
     */
    async deleteChannelSchedule(channelId: string, scheduleId: string): Promise<any> {
        const { data } = await this.request.delete(`/channels/${channelId}/schedules/${scheduleId}`)
        return data
    }
}
