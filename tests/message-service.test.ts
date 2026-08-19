import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MessageService } from '@/services/message'
import { FileProcessor } from '@/message'
import { segment } from '@/segment'
import { createFakeRequest } from './fake-http'

function createMessageService(handler?: Parameters<typeof createFakeRequest>[0]) {
    const fake = createFakeRequest(handler)
    const fileProcessor = new FileProcessor(fake.request)
    const messages = new MessageService(fake.request, 'app-id', fileProcessor)
    return { messages, ...fake }
}

test('sendGroupMessage posts text to the group messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-1' } }))
    const result = await messages.sendGroupMessage('group-openid', 'hello')
    assert.equal(result.id, 'mid-1')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].method, 'post')
    assert.equal(calls[0].url, '/v2/groups/group-openid/messages')
    assert.equal((calls[0].data as { content: string }).content, 'hello')
})

test('sendPrivateMessage posts text to the user messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-2' } }))
    await messages.sendPrivateMessage('user-openid', 'hi')
    assert.equal(calls[0].url, '/v2/users/user-openid/messages')
})

test('sendGuildMessage posts text to the channel messages path', async () => {
    const { messages, calls } = createMessageService(() => ({ data: { id: 'mid-3' } }))
    await messages.sendGuildMessage('channel-id', 'guild hi')
    assert.equal(calls[0].url, '/channels/channel-id/messages')
})

test('group image URL uploads file_info then sends media.file_info', async () => {
    const { messages, calls } = createMessageService((call) => {
        if (call.url.endsWith('/files')) {
            return { data: { file_uuid: 'uuid', file_info: 'info-token', ttl: 60 } }
        }
        return { data: { id: 'mid-img' } }
    })
    const result = await messages.sendGroupMessage('group-openid', segment.image('https://example.com/a.png'))
    assert.equal(result.id, 'mid-img')
    assert.equal(calls[0].url, '/v2/groups/group-openid/files')
    assert.equal(calls[1].url, '/v2/groups/group-openid/messages')
    assert.equal((calls[1].data as { media: { file_info: string } }).media.file_info, 'info-token')
})

test('recallGroupMessage deletes the group message path', async () => {
    const { messages, calls } = createMessageService()
    const ok = await messages.recallGroupMessage('group-openid', 'mid-1')
    assert.equal(ok, true)
    assert.equal(calls[0].method, 'delete')
    assert.equal(calls[0].url, '/v2/groups/group-openid/messages/mid-1')
})

test('sendPrivateStreamMessage posts stream_messages', async () => {
    const { messages, calls } = createMessageService(() => ({
        data: { id: 'stream-1', timestamp: '1' },
    }))
    const result = await messages.sendPrivateStreamMessage('user-openid', { content_raw: 'chunk' })
    assert.equal(result.id, 'stream-1')
    assert.equal(calls[0].url, '/v2/users/user-openid/stream_messages')
    assert.equal((calls[0].data as { content_raw: string }).content_raw, 'chunk')
})
