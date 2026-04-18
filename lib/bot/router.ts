import type { BotContext, EffectiveRole, TelegramUpdate } from './types'
import { resolveContext } from './auth'
import { sendMessage } from './telegram-api'

export interface Command {
  name: string                              // lowercase, no slash
  allowedRoles: readonly EffectiveRole[]    // empty = allowed for all
  handler: (ctx: BotContext, update: TelegramUpdate) => Promise<void>
}

const REGISTRY = new Map<string, Command>()

export function registerCommand(cmd: Command): void {
  REGISTRY.set(cmd.name, cmd)
}

export function getRegisteredCommands(): ReadonlyMap<string, Command> {
  return REGISTRY
}

/** Test-only: clear the command registry between test runs. */
export function resetRegistry(): void {
  REGISTRY.clear()
}

export async function dispatch(update: TelegramUpdate): Promise<void> {
  try {
    const msg = update.message
    const cbq = update.callback_query
    const from = msg?.from ?? cbq?.from
    const chatId = msg?.chat.id ?? cbq?.message?.chat.id
    if (!from || chatId === undefined) return

    const ctx = await resolveContext(chatId, from)

    // Handle shared contact (from /link phone flow)
    if (msg?.contact) {
      const cmd = REGISTRY.get('link')
      if (cmd) {
        await cmd.handler(ctx, update)
      }
      return
    }

    // Parse command from text or callback data
    const text = msg?.text ?? cbq?.data
    if (!text) return

    const commandName = extractCommandName(text)
    if (!commandName) return

    const cmd = REGISTRY.get(commandName)
    if (!cmd) {
      await sendMessage(chatId, 'Unbekannter Befehl. Nutze /help um alle Befehle zu sehen.')
      return
    }

    if (cmd.allowedRoles.length > 0 && !cmd.allowedRoles.includes(ctx.role)) {
      await sendMessage(chatId, 'Du hast keinen Zugriff auf diesen Befehl.')
      return
    }

    await cmd.handler(ctx, update)
  } catch (err) {
    console.error('[bot] dispatch error:', err)
  }
}

function extractCommandName(text: string): string | null {
  const match = text.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?/)
  if (!match) return null
  return match[1].toLowerCase()
}
