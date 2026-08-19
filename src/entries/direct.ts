import type { Bot } from "@/bot"
import type { Sendable, Quotable } from "@/elements"
import type { SendOptions } from "@/services/message"
import type { CommandPanel, PageOptions } from "@/services"

/** 频道私信会话（Guild DM），不是 C2C。 */
export class Direct {
    constructor(private bot: Bot, public readonly guildId: string) {}

    send(message: Sendable, source?: Quotable, options?: SendOptions) {
        return this.bot.messageService.sendDirectMessage(this.guildId, message, source, options)
    }

    recall(messageId: string, hidetip?: boolean) {
        return this.bot.messageService.recallDirectMessage(this.guildId, messageId, hidetip)
    }

    getMessage(messageId: string) {
        return this.bot.messageService.getDirectMessage(this.guildId, messageId)
    }

    panels(options: Omit<PageOptions, 'limit'> & { limit?: number; cursor?: string } = {}) {
        return this.bot.menuPanelService.getCommandPanels({ scope: 'dm', ...options })
    }

    createPanel(panel: CommandPanel) {
        return this.bot.menuPanelService.createCommandPanel({
            scope: 'dm',
            panel,
            target_type: 'all',
        })
    }
}
