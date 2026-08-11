import type { AxiosInstance } from 'axios'

export interface GroupInfo {
    group_openid: string;
    group_name: string;
    group_finger_memo: string;
    group_class_text: string;
    group_tags: string[];
    group_member_num: number;
}

export type GroupMemberRole = 'member' | 'owner' | 'admin'
export type GroupReceiveMessageSetting = 'all' | 'only_mention' | 'mention_and_context'

export interface GroupBotState {
    member_openid: string;
    joined_at: string;
    allow_proactive_msg: boolean;
    recv_msg_setting: GroupReceiveMessageSetting;
    member_role: GroupMemberRole;
}

export interface ReviewQA {
    question: string;
    answer: string;
}

export interface JoinRequestVerifyInfo {
    method: 'verify_message' | 'admin_review_qa';
    verify_message?: string;
    review_qa_list?: ReviewQA[];
}

export interface GroupJoinRequest {
    join_request_id: string;
    risk_tips?: string;
    union_openid?: string;
    member_openid: string;
    username: string;
    apply_at: string;
    apply_source: 'self_apply' | 'invited';
    invited_by?: string;
    bot?: boolean;
    verify_info?: JoinRequestVerifyInfo;
}

export interface PageOptions {
    cursor?: string;
    limit?: number;
}

export interface GroupJoinRequestList {
    list: GroupJoinRequest[];
    next_cursor: string;
}

export interface ApproveJoinRequestOptions {
    op: 'approve' | 'decline';
    join_request_id?: string;
    reject_reason?: string;
    add_to_member_blacklist?: boolean;
}

export interface MuteScheduleRule {
    task_id: string;
    start_at: string;
    end_at: string;
    enabled: boolean;
}

export interface MuteRecurringRule {
    task_id: string;
    weekdays: number[];
    start_time: string;
    end_time: string;
    enabled: boolean;
}

export interface GlobalMuteRule {
    mode: 'none' | 'always' | 'schedule';
    schedule_rules: MuteScheduleRule[];
    recurring_rules: MuteRecurringRule[];
}

export interface MemberMuteState {
    member_openid: string;
    mute_expire_at: string;
    username: string;
    union_openid?: string;
}

export interface GroupMuteSetting {
    global_rule: GlobalMuteRule;
    members: MemberMuteState[];
}

export interface SetMemberMuteState {
    op: 'add' | 'update' | 'del';
    member_openid: string;
    mute_expire_at?: string;
}

export type JoinApprovalStrategyState = 'on' | 'off'

export interface JoinApprovalStrategy {
    strategy_id: string;
    group_openids: string[];
    group_ids: string[];
    whitelist_user_count: number;
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
    created_at: string;
    updated_at: string;
    remark?: string;
}

export interface JoinApprovalStrategyList {
    strategies: JoinApprovalStrategy[];
    next_cursor: string;
}

export interface CreateJoinApprovalStrategyOptions {
    group_openids?: string[];
    group_ids?: string[];
    is_enable?: JoinApprovalStrategyState;
    expire_at?: string;
    remark?: string;
}

export interface CreateJoinApprovalStrategyResult {
    strategy_id: string;
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
}

export interface UpdateJoinApprovalStrategyResult {
    is_enable: JoinApprovalStrategyState;
    expire_at: string;
}

export interface JoinApprovalGroupAction {
    op: 'add' | 'del';
    group_openids?: string[];
    group_ids?: string[];
}

export interface UpdateJoinApprovalStrategyOptions {
    is_enable?: JoinApprovalStrategyState;
    expire_at?: string;
    group_action?: JoinApprovalGroupAction;
    remark?: string;
}

export interface UpdateJoinApprovalWhitelistOptions {
    op: 'add' | 'del';
    whitelist_users: string[];
}

export interface JoinApprovalWhitelistResult {
    strategy_id: string;
    whitelist_user_count: number;
    updated_at: string;
}

/**
 * QQ 群管理 API。
 * 部分接口仅对白名单机器人开放，入群审批和禁言接口还要求机器人是群管理员。
 */
export class GroupService {
    constructor(private request: AxiosInstance) {}

    async getInfo(groupOpenid: string): Promise<GroupInfo> {
        const { data } = await this.request.get<GroupInfo>(`/v2/groups/${groupOpenid}/info`)
        return data
    }

    async getBotState(groupOpenid: string): Promise<GroupBotState> {
        const { data } = await this.request.get<GroupBotState>(`/v2/groups/${groupOpenid}/bot_state`)
        return data
    }

    async getJoinRequests(groupOpenid: string, options: PageOptions = {}): Promise<GroupJoinRequestList> {
        const { data } = await this.request.get<GroupJoinRequestList>(`/v2/groups/${groupOpenid}/join_request_list`, {
            params: options
        })
        return data
    }

    async approveJoinRequest(
        groupOpenid: string,
        memberOpenid: string,
        options: ApproveJoinRequestOptions
    ): Promise<void> {
        await this.request.post(`/v2/groups/${groupOpenid}/approval_join_request/${memberOpenid}`, options)
    }

    async getMuteSetting(groupOpenid: string): Promise<GroupMuteSetting> {
        const { data } = await this.request.get<GroupMuteSetting>(`/v2/groups/${groupOpenid}/restrict_chat_setting`)
        return data
    }

    async setMemberMute(groupOpenid: string, members: SetMemberMuteState[]): Promise<void> {
        await this.request.post(`/v2/groups/${groupOpenid}/restrict_chat_setting`, { members })
    }

    async getJoinApprovalStrategies(options: PageOptions = {}): Promise<JoinApprovalStrategyList> {
        const { data } = await this.request.get<JoinApprovalStrategyList>('/v2/groups/join_approval_strategy', {
            params: options
        })
        return data
    }

    async createJoinApprovalStrategy(options: CreateJoinApprovalStrategyOptions): Promise<CreateJoinApprovalStrategyResult> {
        const { data } = await this.request.post<CreateJoinApprovalStrategyResult>('/v2/groups/join_approval_strategy', options)
        return data
    }

    async updateJoinApprovalStrategy(
        strategyId: string,
        options: UpdateJoinApprovalStrategyOptions
    ): Promise<UpdateJoinApprovalStrategyResult> {
        const { data } = await this.request.patch<UpdateJoinApprovalStrategyResult>(
            `/v2/groups/join_approval_strategy/${strategyId}`,
            options
        )
        return data
    }

    async deleteJoinApprovalStrategy(strategyId: string): Promise<void> {
        await this.request.delete(`/v2/groups/join_approval_strategy/${strategyId}`)
    }

    async executeJoinApprovalStrategy(strategyId: string): Promise<void> {
        await this.request.post(`/v2/groups/join_approval_strategy/${strategyId}/execute`, {})
    }

    async updateJoinApprovalWhitelist(
        strategyId: string,
        options: UpdateJoinApprovalWhitelistOptions
    ): Promise<JoinApprovalWhitelistResult> {
        const { data } = await this.request.post<JoinApprovalWhitelistResult>(
            `/v2/groups/join_approval_strategy/${strategyId}/whitelist_users`,
            options
        )
        return data
    }
}
