# QQ Official Bot

Node SDK for QQ official robots: receive gateway events and call OpenAPI in C2C, group, and guild sessions.

## Language

**Session**:
A conversation surface the robot can send into: C2C (private chat), group, guild channel, or guild DM.
_Avoid_: chat, conversation, room

**C2C**:
One-to-one private chat with a user (OpenAPI `/v2/users/{openid}`).
_Avoid_: friend chat, private (when you mean guild DM)

**Guild DM**:
Private message routed through a guild (`/dms/{guild_id}`), not C2C.
_Avoid_: C2C, private chat

**Outbound message**:
A payload the robot sends: either a normal message (`Sendable` → `/messages`) or a C2C stream (`content_raw` chunks → `/stream_messages`).
_Avoid_: send API, reply (the event helper, not the message itself)

**Stream message**:
A C2C-only outbound message delivered as ordered chunks that share one `stream_msg_id`. Groups do not have this.
_Avoid_: chunked upload, fragmented message

**Rich media**:
An image, video, audio, or file that must become `file_info` before a v2 outbound message can carry it.
_Avoid_: attachment, media file (when you mean the `file_info` token)

**Chunked upload**:
The v2 rich-media path: prepare → PUT parts → finish parts → merge to `file_info`. Distinct from a stream message.
_Avoid_: stream, multipart (guild form-data)

**file_info**:
The opaque token returned by upload; placed in `media.file_info` when sending `msg_type=7`. It expires with `ttl`.
_Avoid_: file id, url, file_data

**Event**:
An inbound gateway dispatch turned into a typed object the robot emits (`message.group`, `notice.group.increase`, …).
_Avoid_: packet, payload (the raw wire body)

**Event registry**:
The single table mapping a gateway name to an internal name, parser, and listener type (`EVENT_REGISTRY`).
_Avoid_: EventParserMap (derived), QQEvent (derived)

**Session entity**:
A handle for one session: `bot.group(id)`, `bot.user(id)`, `bot.channel(id)`, `bot.direct(guildId)`, `bot.guild(id)`. Send, mute, kick, menu, and other per-session OpenAPI calls hang here.
_Avoid_: Contactable, entry (the type-only namespaces)

**Intent**:
A bit the robot subscribes to so the gateway delivers a family of events.
_Avoid_: permission, scope
