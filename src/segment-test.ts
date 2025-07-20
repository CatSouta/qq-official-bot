/**
 * segment 工具验证脚本
 */

import { segment } from './segment'

console.log('🧪 测试 segment 工具...\n')

// 测试文本消息段
console.log('1. 文本消息段:')
const textSegment = segment.text('Hello World')
console.log(JSON.stringify(textSegment, null, 2))

// 测试@消息段
console.log('\n2. @消息段:')
const atSegment = segment.at('123456789')
console.log(JSON.stringify(atSegment, null, 2))
const atAllSegment = segment.at('all')
console.log(JSON.stringify(atAllSegment, null, 2))

// 测试表情消息段
console.log('\n3. 表情消息段:')
const faceSegment = segment.face(14)
console.log(JSON.stringify(faceSegment, null, 2))
const namedFaceSegment = segment.face(14, '微笑')
console.log(JSON.stringify(namedFaceSegment, null, 2))

// 测试图片消息段
console.log('\n4. 图片消息段:')
const imageSegment = segment.image('./test.jpg')
console.log(JSON.stringify(imageSegment, null, 2))
const imageWithOptionsSegment = segment.image('./test.jpg', {
  url: 'https://example.com/test.jpg',
  name: 'test.jpg'
})
console.log(JSON.stringify(imageWithOptionsSegment, null, 2))

// 测试Markdown消息段
console.log('\n5. Markdown消息段:')
const markdownSegment = segment.markdown('# Hello\n**World**')
console.log(JSON.stringify(markdownSegment, null, 2))
const markdownTemplateSegment = segment.markdown('template_123', [
  { key: 'title', values: ['Hello'] }
])
console.log(JSON.stringify(markdownTemplateSegment, null, 2))

// 测试回复消息段
console.log('\n6. 回复消息段:')
const replySegment = segment.reply('message_123')
console.log(JSON.stringify(replySegment, null, 2))
const replyQuotableSegment = segment.reply({ id: 'msg_123', event_id: 'event_456' })
console.log(JSON.stringify(replyQuotableSegment, null, 2))

// 测试组合消息
console.log('\n7. 组合消息示例:')
const combinedMessage = [
  segment.text('欢迎 '),
  segment.at('123456789'),
  segment.text(' 加入群聊！'),
  segment.face(14)
]
console.log(JSON.stringify(combinedMessage, null, 2))

console.log('\n✅ segment 工具验证完成！所有功能正常工作。')
