import type { AxiosInstance } from 'axios'
import type { TextElem } from '@/elements'

export type MenuCommandText = string | TextElem

function toCommandText(content: MenuCommandText): string {
    return typeof content === 'string' ? content : content.data.text
}

export type MenuItemType = 'switch' | 'send_message' | 'link' | 'menu'
export type SubMenuItemType = 'send_message' | 'link'
export type PanelScope = 'c2c' | 'group' | 'channel' | 'dm'
export type PanelTargetType = 'all' | 'specific'
export type PanelItemType = 'command' | 'link'
export type PanelTargetOp = 'add' | 'del'

export interface MenuSwitch {
    /** 开关唯一标识。用户打开后消息 `ext` 会携带 `{switch_id}=1`，关闭后不携带 */
    switch_id: string;
    /** 初始状态，true 为默认打开 */
    default: boolean;
}

export interface SubMenuItem {
    name: string;
    type: SubMenuItemType;
    send_message?: string;
    link?: string;
}

export interface MenuItem {
    name: string;
    type: MenuItemType;
    sub_menu_items?: SubMenuItem[];
    send_message?: string;
    link?: string;
    switch?: MenuSwitch;
}

export interface CustomMenu {
    items: MenuItem[];
}

export interface CustomMenuInfo {
    version?: number;
    menu?: CustomMenu;
}

export interface UpdateCustomMenuResult {
    version: number;
}

export interface PanelItem {
    name: string;
    type: PanelItemType;
    desc?: string;
    only_admin?: boolean;
    link?: string;
}

export interface CommandPanel {
    items: PanelItem[];
    remark?: string;
    version?: number;
}

export interface PanelRecord {
    panel_id: string;
    scope: PanelScope;
    target_type: PanelTargetType;
    panel: CommandPanel;
    created_at?: string;
    updated_at?: string;
    version: number;
}

export interface CommandPanelListOptions {
    scope: PanelScope;
    cursor?: string;
    limit?: number;
}

export interface CommandPanelList {
    records: PanelRecord[];
    next_cursor: string;
    is_end: boolean;
}

export interface CreateCommandPanelOptions {
    scope: PanelScope;
    panel: CommandPanel;
    target_type?: PanelTargetType;
    user_openids?: string[];
    group_openids?: string[];
}

export interface CreateCommandPanelResult {
    panel_id: string;
}

export interface CommandPanelDetail extends PanelRecord {
    user_openids?: string[];
    group_openids?: string[];
}

export interface UpdateCommandPanelResult {
    version: number;
}

export interface UpdateCommandPanelTargetsOptions {
    op: PanelTargetOp;
    user_openids?: string[];
    group_openids?: string[];
}

export interface PanelItemOptions {
    desc?: string;
    onlyAdmin?: boolean;
}

function applyPanelItemOptions<T extends PanelItem>(item: T, options?: PanelItemOptions): T {
    if (!options) return item
    if (options.desc != null) item.desc = options.desc
    if (options.onlyAdmin != null) item.only_admin = options.onlyAdmin
    return item
}

/**
 * 自定义菜单工厂，用法类似 `segment`。
 * `sendMessage` / `link` 也可作为子菜单项。
 */
export const menu = {
    /**
     * 发送消息按钮。点击后把文本填入聊天输入框。
     * 可直接传入字符串，或使用 `segment.text('/help')`。
     */
    sendMessage(name: string, content: MenuCommandText): SubMenuItem {
        return {
            name,
            type: 'send_message',
            send_message: toCommandText(content),
        }
    },
    /** 链接跳转按钮，URL 必须以 `https://` 开头 */
    link(name: string, url: string): SubMenuItem {
        return {
            name,
            type: 'link',
            link: url,
        }
    },
    /**
     * 开关按钮。用户打开后，后续消息 `ext` 会携带 `{switchId}=1`。
     */
    switch(name: string, switchId: string, enabled = false): MenuItem {
        return {
            name,
            type: 'switch',
            switch: {
                switch_id: switchId,
                default: enabled,
            },
        }
    },
    /** 折叠子菜单，最多 5 个子项，且不能再嵌套 */
    submenu(name: string, ...items: SubMenuItem[]): MenuItem {
        return {
            name,
            type: 'menu',
            sub_menu_items: items,
        }
    },
    /** 组装完整自定义菜单 */
    build(...items: MenuItem[]): CustomMenu {
        return { items }
    },
    /** 把菜单指令内容转成文本消息段，便于机器人按相同文本回复 */
    text(content: MenuCommandText): TextElem {
        return {
            type: 'text',
            data: {
                text: toCommandText(content),
            },
        }
    },
}

/**
 * 指令面板工厂，用法类似 `segment`。
 */
export const panel = {
    /**
     * 指令项。点击后把 `name` 填入聊天输入框。
     * `name` 可直接传字符串，或使用 `segment.text('查询天气')`。
     */
    command(name: MenuCommandText, options?: PanelItemOptions): PanelItem {
        return applyPanelItemOptions({
            name: toCommandText(name),
            type: 'command',
        }, options)
    },
    /** 链接项，URL 必须以 `https://` 开头 */
    link(name: string, url: string, options?: PanelItemOptions): PanelItem {
        return applyPanelItemOptions({
            name,
            type: 'link',
            link: url,
        }, options)
    },
    /** 组装完整指令面板 */
    build(items: PanelItem[], remark?: string): CommandPanel {
        return remark != null ? { items, remark } : { items }
    },
    /** 把面板指令名称转成文本消息段 */
    text(content: MenuCommandText): TextElem {
        return menu.text(content)
    },
}

export type MenuFactory = typeof menu
export type PanelFactory = typeof panel

/**
 * 自定义菜单与指令面板 API。
 * @see https://bot.q.qq.com/wiki/develop/api-v2/server-inter/menu-panel/
 */
export class MenuPanelService {
    static readonly menu = menu
    static readonly panel = panel

    constructor(private request: AxiosInstance) {}

    /**
     * 查询全局自定义菜单。
     * 仅 C2C 场景生效；未设置过时 `menu` 为空。
     */
    async getCustomMenu(): Promise<CustomMenuInfo> {
        const { data } = await this.request.get<CustomMenuInfo>('/v2/menu')
        return data
    }

    /**
     * 修改全局自定义菜单，传入后会覆盖原有完整配置。
     */
    async updateCustomMenu(menu: CustomMenu): Promise<UpdateCustomMenuResult> {
        const { data } = await this.request.put<UpdateCustomMenuResult>('/v2/menu', { menu })
        return data
    }

    /**
     * 分页查询指定场景下的指令面板列表。
     */
    async getCommandPanels(options: CommandPanelListOptions): Promise<CommandPanelList> {
        const { data } = await this.request.get<CommandPanelList>('/v2/panels', {
            params: options
        })
        return data
    }

    /**
     * 创建指令面板。一个机器人最多 20 个。
     * channel / dm 仅支持 `target_type=all`。
     */
    async createCommandPanel(options: CreateCommandPanelOptions): Promise<CreateCommandPanelResult> {
        const { data } = await this.request.post<CreateCommandPanelResult>('/v2/panels', options)
        return data
    }

    /**
     * 查询指令面板详情，含关联用户/群列表。
     */
    async getCommandPanel(panelId: string): Promise<CommandPanelDetail> {
        const { data } = await this.request.get<CommandPanelDetail>(`/v2/panels/${panelId}`)
        return data
    }

    /**
     * 修改指令面板内容，不影响已关联的用户/群。
     */
    async updateCommandPanel(panelId: string, panel: CommandPanel): Promise<UpdateCommandPanelResult> {
        const { data } = await this.request.put<UpdateCommandPanelResult>(`/v2/panels/${panelId}`, { panel })
        return data
    }

    /**
     * 删除指令面板。
     */
    async deleteCommandPanel(panelId: string): Promise<void> {
        await this.request.delete(`/v2/panels/${panelId}`)
    }

    /**
     * 增删指令面板关联对象。仅 c2c / group 且 `target_type=specific` 时可用。
     */
    async updateCommandPanelTargets(
        panelId: string,
        options: UpdateCommandPanelTargetsOptions
    ): Promise<void> {
        await this.request.put(`/v2/panels/${panelId}/target`, options)
    }
}
