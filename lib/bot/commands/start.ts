import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { linkCommand } from './link'

export const startCommand: Command = {
  name: 'start',
  allowedRoles: [],
  handler: async (ctx, update) => {
    const text = update.message?.text ?? ''
    const match = text.match(/^\/start(?:@\w+)?\s+link_([A-HJKMNP-Z2-9]{6})/i)
    if (match) {
      // Rewrite the update as a /link command and dispatch
      const modifiedUpdate = {
        ...update,
        message: update.message
          ? { ...update.message, text: `/link ${match[1].toUpperCase()}` }
          : update.message,
      }
      await linkCommand.handler(ctx, modifiedUpdate)
      return
    }

    const welcome = `\u{1F94B} Willkommen bei AXIS Jiu-Jitsu!\n\nIch bin der offizielle Bot. Hier kannst du dein Training verwalten und alles rund ums Gym erfahren.\n\nZum Start: verkn\u00FCpfe deinen Account mit deinem Gym-Profil:\n\u2022 /link mit Magic-Code von der Website (auf /konto)\n\u2022 oder /link und deine Telefonnummer teilen\n\nMit /help siehst du alle verf\u00FCgbaren Befehle.`
    await sendMessage(ctx.chatId, welcome)
  },
}
