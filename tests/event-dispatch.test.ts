import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Client } from '@/client'
import { ReceiverFactory, ReceiverMode } from '@/receivers'
import type { GroupMessageEvent } from '@/events'
import type { GroupActionNoticeEvent } from '@/events/notice'

afterEach(() => {
    ReceiverFactory.clearAll()
})

function createClient() {
    return new Client({
        appid: `test-${Date.now()}-${Math.random()}`,
        secret: 'secret',
        mode: ReceiverMode.WEBSOCKET,
        logLevel: 'off',
    })
}

test('GROUP_MESSAGE_CREATE emits message.group with the group id', async () => {
    const client = createClient()
    const seen: GroupMessageEvent[] = []
    client.on('message.group', (event) => {
        seen.push(event)
    })
    client.dispatchEvent('GROUP_MESSAGE_CREATE', {
        op: 0,
        s: 1,
        t: 'GROUP_MESSAGE_CREATE',
        id: 'evt-1',
        d: {
            id: 'mid-1',
            group_id: 'group-openid',
            content: 'hello',
            timestamp: '2024-01-01T00:00:00.000Z',
            author: { id: 'user-1', username: 'alice' },
        },
    })
    assert.equal(seen.length, 1)
    assert.equal(seen[0].group_id, 'group-openid')
    assert.equal(seen[0].message_id, 'mid-1')
})

test('INTERACTION_CREATE in a group emits notice.group.action once via em bubbling', async () => {
    const client = createClient()
    const names: string[] = []
    client.on('notice', () => names.push('notice'))
    client.on('notice.group', () => names.push('notice.group'))
    client.on('notice.group.action', (event: GroupActionNoticeEvent) => {
        names.push('notice.group.action')
        assert.equal(event.group_id, 'group-openid')
    })
    client.dispatchEvent('INTERACTION_CREATE', {
        op: 0,
        s: 2,
        t: 'INTERACTION_CREATE',
        id: 'evt-2',
        d: {
            id: 'notice-1',
            scene: 'group',
            group_openid: 'group-openid',
            group_member_openid: 'user-1',
            data: {
                type: 1,
                resolved: { button_id: 'btn-1' },
            },
        },
    })
    assert.deepEqual(names, ['notice', 'notice.group', 'notice.group.action'])
})

test('unknown gateway name does not emit application events', async () => {
    const client = createClient()
    let emitted = false
    client.on('message', () => {
        emitted = true
    })
    client.dispatchEvent('NOT_A_REAL_EVENT', {
        op: 0,
        s: 3,
        t: 'NOT_A_REAL_EVENT',
        id: 'evt-3',
        d: { id: 'x' },
    })
    assert.equal(emitted, false)
})
