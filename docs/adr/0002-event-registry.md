# One registry for inbound gateway events; Connection is not a second stack

A new gateway event had to be listed in `QQEvent`, `EventParserMap`, and `EventMap`. Interaction constructors also `emit`ed, then `Client.em()` emitted again. `Connection` implemented heartbeat/reconnect but `Session.start()` never called `connect()` — that logic already lives in `WebSocketReceiver`.

We decided: `EVENT_REGISTRY` is the runtime source (gateway name → internal name → parser). `QQEvent` and `EventParserMap` are derived. `Client.em()` is the only emit path; interaction constructors only parse. Delete `Connection` and keep session resume fields on `Session`. Do not move heartbeat into `Connection` (that would duplicate `WebSocketReceiver`).

**Considered options:** make `Session` actually drive `Connection` for heartbeat. Rejected: Receiver already owns the live socket; a second stack would reintroduce dual reconnect.
