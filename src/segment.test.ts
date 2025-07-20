/**
 * segment 工具测试
 */

import { segment } from './segment'

describe('segment 工具测试', () => {
  test('text - 创建文本消息段', () => {
    const result = segment.text('Hello World')
    expect(result).toEqual({
      type: 'text',
      text: 'Hello World'
    })
  })

  test('at - 创建@消息段', () => {
    const result = segment.at('123456789')
    expect(result).toEqual({
      type: 'at',
      user_id: '123456789'
    })

    const atAll = segment.at('all')
    expect(atAll).toEqual({
      type: 'at',
      user_id: 'all'
    })
  })

  test('face - 创建表情消息段', () => {
    const result = segment.face(14)
    expect(result).toEqual({
      type: 'face',
      id: 14
    })

    const withText = segment.face(14, '微笑')
    expect(withText).toEqual({
      type: 'face',
      id: 14,
      text: '微笑'
    })
  })

  test('image - 创建图片消息段', () => {
    const result = segment.image('./test.jpg')
    expect(result).toEqual({
      type: 'image',
      file: './test.jpg'
    })

    const withOptions = segment.image('./test.jpg', {
      url: 'https://example.com/test.jpg',
      name: 'test.jpg'
    })
    expect(withOptions).toEqual({
      type: 'image',
      file: './test.jpg',
      url: 'https://example.com/test.jpg',
      name: 'test.jpg'
    })
  })

  test('video - 创建视频消息段', () => {
    const result = segment.video('./test.mp4')
    expect(result).toEqual({
      type: 'video',
      file: './test.mp4'
    })
  })

  test('audio - 创建音频消息段', () => {
    const result = segment.audio('./test.mp3')
    expect(result).toEqual({
      type: 'audio',
      file: './test.mp3'
    })
  })

  test('markdown - 创建Markdown消息段', () => {
    // 直接内容模式
    const contentResult = segment.markdown('# Hello\n**World**')
    expect(contentResult).toEqual({
      type: 'markdown',
      content: '# Hello\n**World**',
      custom_template_id: null,
      params: null
    })

    // 自定义模板模式
    const templateResult = segment.markdown('template_123', [
      { key: 'title', values: ['Hello'] }
    ])
    expect(templateResult).toEqual({
      type: 'markdown',
      content: null,
      custom_template_id: 'template_123',
      params: [{ key: 'title', values: ['Hello'] }]
    })
  })

  test('ark - 创建ARK消息段', () => {
    const result = segment.ark(37, [
      { key: 'title', value: 'Hello' }
    ])
    expect(result).toEqual({
      type: 'ark',
      template_id: 37,
      kv: [{ key: 'title', value: 'Hello' }]
    })
  })

  test('embed - 创建Embed消息段', () => {
    const result = segment.embed(
      'Title',
      'Description',
      { url: 'https://example.com/thumb.jpg' },
      [{ name: 'Field1' }]
    )
    expect(result).toEqual({
      type: 'embed',
      title: 'Title',
      prompt: 'Description',
      htumbnail: { url: 'https://example.com/thumb.jpg' },
      fields: [{ name: 'Field1' }]
    })
  })

  test('button - 创建按钮消息段', () => {
    const result = segment.button({ 
      text: 'Click me',
      action: 'callback',
      data: 'button_data'
    })
    expect(result).toEqual({
      type: 'button',
      data: {
        text: 'Click me',
        action: 'callback',
        data: 'button_data'
      }
    })
  })

  test('link - 创建链接消息段', () => {
    const result = segment.link('channel_123')
    expect(result).toEqual({
      type: 'link',
      channel_id: 'channel_123'
    })
  })

  test('reply - 创建回复消息段', () => {
    // 使用字符串ID
    const result1 = segment.reply('message_123')
    expect(result1).toEqual({
      type: 'reply',
      id: 'message_123'
    })

    // 使用Quotable对象
    const result2 = segment.reply({ id: 'msg_123', event_id: 'event_456' })
    expect(result2).toEqual({
      type: 'reply',
      id: 'msg_123',
      event_id: 'event_456'
    })
  })

  test('keyboard - 创建键盘按钮组消息段', () => {
    const result = segment.keyboard('keyboard_123')
    expect(result).toEqual({
      type: 'keyboard',
      id: 'keyboard_123'
    })
  })
})
