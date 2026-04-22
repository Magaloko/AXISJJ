import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

// In-memory rate guard. One /broadcast per 60 seconds is more than enough —
// the command literally fans out to every member, so a misfire is very loud.
let lastCallAt = 0
const RATE_WINDOW_MS = 60_000
const SEND_DELAY_MS = 40

/**
 * /broadcast <text> — owner-only. Sends the plain-text message to every
 * linked member's Telegram chat, sequentially with a small delay to stay
 * inside Telegram's ~30 msgs/sec limit.
 */
export const broadcastCommand: Command = {
  name: 'broadcast',
  allowedRoles: ['admin'], // bot_role 'admin' = gym owner; see bot_users schema
  handler: async (ctx, update) => {
    const raw = update.message?.text ?? ''
    const text = raw.replace(/^\/broadcast(@\w+)?\s*/i, '').trim()
    if (!text) {
      await sendMessage(
        ctx.chatId,
        'Nutzung: /broadcast <Nachricht an alle verknüpften Mitglieder>',
      )
      return
    }

    const nowMs = Date.now()
    if (nowMs - lastCallAt < RATE_WINDOW_MS) {
      const wait = Math.ceil((RATE_WINDOW_MS - (nowMs - lastCallAt)) / 1000)
      await sendMessage(ctx.chatId, `⏳ Bitte noch ${wait}s warten vor dem nächsten /broadcast.`)
      return
    }
    lastCallAt = nowMs

    const supabase = createServiceRoleClient()
    const { data: recipients, error } = await supabase
      .from('bot_users')
      .select('chat_id, profile_id, profiles!inner(role)')
      .eq('profiles.role', 'member')

    if (error) {
      console.error('[bot/broadcast] recipients query error:', error)
      await sendMessage(ctx.chatId, '⚠️ Konnte Empfänger nicht laden.')
      return
    }

    const targets = (recipients ?? []) as { chat_id: number }[]
    if (targets.length === 0) {
      await sendMessage(ctx.chatId, 'Keine verknüpften Mitglieder.')
      return
    }

    const body = `📣 ${text}`
    console.log(
      `[bot/broadcast] owner=${ctx.profile?.id ?? 'unknown'} recipients=${targets.length} text=${text}`,
    )

    let sent = 0
    for (const t of targets) {
      await sendMessage(Number(t.chat_id), body)
      sent += 1
      // Stay inside Telegram's rate envelope.
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS))
    }

    await sendMessage(ctx.chatId, `✅ Broadcast gesendet an ${sent} Mitglied(er).`)
  },
}
