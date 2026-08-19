import { EventEmitter } from "events";
import { Client } from "@/client";
import {ReceiverMode, ApplicationPlatform, ResolveConfig, ReceiverConfigBuilder} from "@/receivers";
import { Intends } from "@/constants";
import { DataPacket } from "@/types";

import { Auth } from "@/core/auth";

import { ReceiverFactory,ResolveReceiver } from "@/receivers";

/**
 * 会话管理器：认证 + 接收器。心跳与重连只活在 WebSocketReceiver。
 */
export class Session<T extends ReceiverMode, M extends ApplicationPlatform = never> extends EventEmitter {
    public get access_token(): string {
        return this.authManager.getCurrentTokenInfo()?.access_token || "";
    }

    public get wsUrl(): string {
        return this._wsUrl || "";
    }

    public get sessionRecord() {
        return {
            sessionID: this._sessionID,
            seq: this._seq
        };
    }

    public readonly receiver: ResolveReceiver<T, M>;

    public getBot(): Client<T, M> {
        return this.bot;
    }

    public userClose: boolean = false;

    private readonly bot: Client<T, M>;
    private readonly authManager: Auth;
    private _wsUrl: string = "";
    private _sessionID: string = "";
    private _seq: number = 0;

    constructor(bot: Client<T, M>) {
        super();
        this.bot = bot;
        const authOptions: ConstructorParameters<typeof Auth>[0] = {
            appid: bot.config.appid,
            secret: bot.config.secret,
            maxRetries: 3,
            tokenRefreshBuffer: 45
        };
        if (bot.config.mode === ReceiverMode.WEBSOCKET) {
            const wsConfig = bot.config as Client.Config<ReceiverMode.WEBSOCKET, M>;
            if (wsConfig.accessTokenUrl) authOptions.accessTokenUrl = wsConfig.accessTokenUrl;
            if (wsConfig.gatewayUrl) authOptions.gatewayUrl = wsConfig.gatewayUrl;
        }
        this.authManager = new Auth(authOptions, bot);
        this.receiver = this.createReceiver();
        this.receiver.on("packet", (packet: DataPacket) => {
            this.bot.dispatchEvent(packet.t, packet);
        });
    }

    private createReceiver(){
        if (this.bot.config.mode === ReceiverMode.WEBSOCKET) {
            const config = this.bot.config as Client.Config<ReceiverMode.WEBSOCKET, M>;
            const websocketConfig = ReceiverConfigBuilder.websocket({
                heartbeatInterval: config.heartbeatInterval,
                maxRetries: config.maxRetries ?? config.maxRetry,
                reconnectDelay: config.reconnectDelay
            });
            return ReceiverFactory.createReceiver(this.bot.config.appid, this.bot.config.mode, websocketConfig as unknown as ResolveConfig<T, M>);
        }
        return ReceiverFactory.createReceiver(this.bot.config.appid,this.bot.config.mode,this.bot.config as unknown as ResolveConfig<T, M>)
    }

    async getAccessToken(): Promise<Client.Token> {
        const tokenInfo = await this.authManager.refreshAccessToken();

        return {
            access_token: tokenInfo.access_token,
            expires_in: tokenInfo.expires_in,
        };
    }

    async getWsUrl(): Promise<string> {
        this._wsUrl = await this.authManager.getGatewayUrl();
        return this._wsUrl;
    }

    getValidIntends(): number {
        return (this.bot.config.intents || []).reduce((result, item) => {
            const value = Intends[item as keyof typeof Intends];
            if (value === undefined) {
                this.bot.logger.warn(`无效的意图(${item})，已跳过...`);
                return result;
            }
            return value | result;
        }, 0);
    }

    async start() {
        return new Promise<void>(async (resolve) => {
            await this.getAccessToken()
            this.receiver.emit('start',this)
            this.receiver.on('ready',resolve)
        })
    }

    async stop() {
        this.userClose = true
        this.receiver.emit('stop',this)
    }

    public updateSessionRecord(record: { sessionID?: string; seq?: number }): void {
        if (record.sessionID !== undefined) {
            this._sessionID = record.sessionID;
        }
        if (record.seq !== undefined) {
            this._seq = record.seq % 4294967296;
        }
    }
}
