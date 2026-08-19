# Session entities are the send surface; Bot aliases stay

Callers had to remember `sendGroupMessage` vs `sendPrivateMessage` vs `sendGuildMessage`, and `event.reply` called the whole `Bot`. `Contactable` existed but was unused.

We decided: `bot.group(id)`, `bot.user(id)`, `bot.channel(id)`, `bot.direct(guildId)`, and `bot.guild(id)` are the session handles. Send, recall, upload, mute, kick, menu panels, pins, and the other per-session OpenAPI calls hang here. Implementation stays in `*Service`. `event.reply` / `event.pin` call the entity. Old `bot.sendGroupMessage` / `bot.muteGuild` remain as aliases. `Contactable` is deleted.

Join-approval strategies and the global C2C custom menu stay on `Bot` / `*Service` because they are not keyed by one session id.
