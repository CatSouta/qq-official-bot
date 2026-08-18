# 自定义菜单与指令面板

机器人可在单聊场景配置**自定义菜单**，在单聊、群聊、文字子频道、频道私信场景配置**指令面板**，帮助用户发现和使用机器人能力。接口集中在 `bot.menuPanelService`，同时提供 `bot.getCustomMenu()` 等快捷方法。创建配置时推荐使用 `menu` / `panel` 工厂，写法与 `segment` 一致。

官方文档：[自定义菜单与指令面板](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/menu-panel/)

::: warning 频控
自定义菜单查询 30 QPM、修改 5 QPM；指令面板查询 30 QPM、创建/修改/删除 10 QPM、关联对象 60 QPM。详细限制以 [QQ 官方文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/menu-panel/) 为准。
:::

## 自定义菜单

自定义菜单展示在机器人单聊窗口底部，支持开关、发送消息、链接跳转、含子菜单的折叠项。设置后对所有用户生效，不支持按用户区分。

### 工厂方法

```typescript
import { menu, panel, segment } from 'qq-official-bot'

const result = await bot.updateCustomMenu(menu.build(
    menu.sendMessage('帮助', '/help'),
    menu.sendMessage('签到', segment.text('/sign')),
    menu.link('官网', 'https://example.com'),
    menu.switch('搜索', 'search'),
    menu.submenu(
        '更多',
        menu.sendMessage('设置', '/settings'),
        menu.link('文档', 'https://docs.example.com'),
    ),
))

// 与菜单指令相同的文本消息段，可直接用于回复
await bot.sendPrivateMessage(user_id, menu.text('/help'))

const { panel_id } = await bot.createCommandPanel({
    scope: 'c2c',
    target_type: 'all',
    panel: panel.build([
        panel.command('查询天气', { desc: '查询当前天气' }),
        panel.command(segment.text('群签到'), { desc: '每日签到', onlyAdmin: false }),
        panel.link('更多服务', 'https://example.com', { desc: '打开更多服务' }),
    ], 'C2C 面板'),
})
```

也可通过 `MenuPanelService.menu` / `MenuPanelService.panel` 调用同样的静态方法。

| 方法 | 说明 |
|------|------|
| `menu.sendMessage(name, content)` | 发送消息按钮，`content` 可以是字符串或 `segment.text()` |
| `menu.link(name, url)` | 链接跳转按钮 |
| `menu.switch(name, switchId, enabled?)` | 开关按钮，默认关闭 |
| `menu.submenu(name, ...items)` | 折叠子菜单 |
| `menu.build(...items)` | 组装完整菜单 |
| `menu.text(content)` | 把指令内容转成文本消息段 |
| `panel.command(name, options?)` | 指令项，`name` 可以是字符串或 `segment.text()` |
| `panel.link(name, url, options?)` | 面板链接项 |
| `panel.build(items, remark?)` | 组装完整面板 |
| `panel.text(content)` | 把指令名称转成文本消息段 |

### 查询全局自定义菜单

**方法名**: `bot.menuPanelService.getCustomMenu()` / `bot.getCustomMenu()`

```typescript
const current = await bot.getCustomMenu()
console.log(current.version, current.menu?.items)
```

未设置过菜单时 `menu` 为空。接口频率 30 QPM。

### 修改全局自定义菜单

**方法名**: `bot.menuPanelService.updateCustomMenu(menu)` / `bot.updateCustomMenu(menu)`

传入后会覆盖原有完整配置。一级菜单最多 10 项；`type=menu` 的子菜单最多 5 项，且不能再嵌套。

```typescript
import { menu } from 'qq-official-bot'

const result = await bot.updateCustomMenu(menu.build(
    menu.sendMessage('帮助', '/help'),
    menu.link('官网', 'https://example.com'),
    menu.switch('搜索', 'search'),
    menu.submenu(
        '更多',
        menu.sendMessage('设置', '/settings'),
    ),
))
console.log(result.version)
```

等价的对象写法：

```typescript
const result = await bot.updateCustomMenu({
    items: [
        {
            type: 'send_message',
            name: '帮助',
            send_message: '/help',
        },
        {
            type: 'link',
            name: '官网',
            link: 'https://example.com',
        },
        {
            type: 'switch',
            name: '搜索',
            switch: {
                switch_id: 'search',
                default: false,
            },
        },
        {
            type: 'menu',
            name: '更多',
            sub_menu_items: [
                {
                    type: 'send_message',
                    name: '设置',
                    send_message: '/settings',
                },
            ],
        },
    ],
})
console.log(result.version)
```

按钮类型：

| `type` | 说明 |
|--------|------|
| `send_message` | 点击后把 `send_message` 填入聊天输入框 |
| `link` | 跳转到 `https://` 链接 |
| `switch` | 开关；用户打开后消息 `ext` 会带 `{switch_id}=1` |
| `menu` | 折叠子菜单，仅一级可用 |

接口频率 5 QPM。

## 指令面板

指令面板以面板形式展示指令或链接，支持按 `c2c`、`group`、`channel`、`dm` 场景生效。一个机器人最多 20 个面板，每个面板最多 20 个元素。

| 场景 | `scope` | 作用范围 |
|------|---------|----------|
| 单聊 | `c2c` | `all` 或 `specific`（指定用户） |
| 群聊 | `group` | `all` 或 `specific`（指定群） |
| 文字子频道 | `channel` | 仅 `all` |
| 频道私信 | `dm` | 仅 `all` |

### 查询指令面板列表

**方法名**: `bot.getCommandPanels({ scope, cursor?, limit? })`

`scope` 必填；`limit` 默认 20，最大 50。`next_cursor` 为空或 `is_end=true` 表示已到末页。

```typescript
const page = await bot.getCommandPanels({
    scope: 'c2c',
    limit: 10,
})
console.log(page.records, page.next_cursor, page.is_end)
```

接口频率 30 QPM。

### 创建指令面板

**方法名**: `bot.createCommandPanel(options)`

```typescript
import { panel } from 'qq-official-bot'

const { panel_id } = await bot.createCommandPanel({
    scope: 'c2c',
    target_type: 'all',
    panel: panel.build([
        panel.command('查询天气', { desc: '查询当前天气' }),
        panel.link('更多服务', 'https://example.com'),
    ], 'C2C 面板'),
})

const groupPanel = await bot.createCommandPanel({
    scope: 'group',
    target_type: 'specific',
    group_openids: ['openid_group_001'],
    panel: panel.build([
        panel.command('群签到', { desc: '每日签到', onlyAdmin: false }),
    ]),
})
```

`user_openids` / `group_openids` 仅在对应场景且 `target_type=specific` 时有效，一次最多 20 个。接口频率 10 QPM。

### 查询指令面板详情

**方法名**: `bot.getCommandPanel(panelId)`

```typescript
const detail = await bot.getCommandPanel(panel_id)
console.log(detail.scope, detail.target_type, detail.panel.items)
console.log(detail.user_openids, detail.group_openids)
```

接口频率 30 QPM。

### 修改指令面板

**方法名**: `bot.updateCommandPanel(panelId, panel)`

覆盖面板元素和备注，不影响已关联的用户/群。

```typescript
const { version } = await bot.updateCommandPanel(panel_id, panel.build([
    panel.command('新指令', { desc: '更新后的指令' }),
], '更新备注'))
```

接口频率 10 QPM。

### 删除指令面板

**方法名**: `bot.deleteCommandPanel(panelId)`

```typescript
await bot.deleteCommandPanel(panel_id)
```

接口频率 10 QPM。

### 修改指令面板关联对象

**方法名**: `bot.updateCommandPanelTargets(panelId, options)`

仅 `c2c` / `group` 且 `target_type=specific` 可用。一次最多 20 个 openid。

```typescript
await bot.updateCommandPanelTargets(panel_id, {
    op: 'add',
    group_openids: ['openid_group_003'],
})

await bot.updateCommandPanelTargets(panel_id, {
    op: 'del',
    user_openids: ['openid_user_001'],
})
```

接口频率 60 QPM。

## 注意事项

- 链接必须以 `https://` 开头
- 菜单按钮名称最多 10 个字符（一个中文汉字算 2 个字符）
- 面板元素名称最多 14 个字符，描述最多 30 个字符
- `target_type=all` 的面板不能调用关联对象接口
- 内容需符合平台运营规范，否则可能返回 `40030020`
