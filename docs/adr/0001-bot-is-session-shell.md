# Bot is a session shell; OpenAPI lives in one module per domain

Bot used to mix thin aliases with a second copy of HTTP calls. New official capabilities were landing in *Service while guild/member/schedule stayed inline, so the same endpoint drifted (pagination, `{guild_id}` in the path).

We decided: each OpenAPI endpoint has one implementation inside its domain module (`GuildService`, `MessageService`, …). `Bot` public method names stay as aliases. Outbound messaging (build, rich-media upload, send, C2C stream) shares one `FileProcessor` and an explicit send target — not a path string.

Session entities (`bot.group(id).send`) came in a later pass once this seam was stable; see [0003](0003-session-entities.md).
