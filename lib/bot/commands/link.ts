import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { normalizePhone } from './_format'
import type { BotContext, TelegramUpdate } from '../types'

const FRIENDLY_ROLE: Record<string, string> = {
  admin: 'Admin \u{1F451}',
  moderator: 'Moderator \u{1F6E1}\uFE0F',
  coach: 'Trainer \u{1F94B}',
  member: 'Mitglied \u{1F530}',
}

export const linkCommand: Command = {
  name: 'link',
  allowedRoles: [],
  handler: async (ctx, update) => {
    if (ctx.role !== 'unlinked') {
      await sendMessage(ctx.chatId, 'Du bist bereits verkn\u00FCpft. Sende /me f\u00FCr deine Daten oder /unlink zum L\u00F6sen.')
      return
    }

    // Mode: contact shared
    if (update.message?.contact) {
      await linkByPhone(ctx, update)
      return
    }

    // Mode: /link CODE
    const text = update.message?.text ?? ''
    const match = text.match(/^\/link(?:@\w+)?\s+([A-HJKMNP-Z2-9]{6})/i)
    if (match) {
      await linkByCode(ctx, match[1].toUpperCase())
      return
    }

    // Mode: /link alone \u2192 ask for contact
    await sendMessage(
      ctx.chatId,
      '\u{1F4F1} Teile deine Telefonnummer zum Verkn\u00FCpfen, oder sende /link CODE mit einem 6-stelligen Code von /konto.',
      {
        reply_markup: {
          keyboard: [[{ text: 'Nummer teilen', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      },
    )
  },
}

async function linkByCode(ctx: BotContext, code: string): Promise<void> {
  const supabase = createServiceRoleClient()
  const { data: codeRow } = await supabase
    .from('bot_link_codes')
    .select('code, profile_id, expires_at, used_at')
    .eq('code', code)
    .maybeSingle()
  if (!codeRow) {
    await sendMessage(ctx.chatId, '\u274C Code ung\u00FCltig. Neuen Code auf /konto anfordern.')
    return
  }
  const row = codeRow as { code: string; profile_id: string; expires_at: string; used_at: string | null }
  if (row.used_at) {
    await sendMessage(ctx.chatId, '\u274C Code bereits verwendet. Neuen Code anfordern.')
    return
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sendMessage(ctx.chatId, '\u274C Code abgelaufen. Neuen Code auf /konto anfordern.')
    return
  }
  await performLink(ctx, row.profile_id, row.code)
}

async function linkByPhone(ctx: BotContext, update: TelegramUpdate): Promise<void> {
  const contact = update.message!.contact!
  const from = update.message!.from!
  if (contact.user_id && contact.user_id !== from.id) {
    await sendMessage(ctx.chatId, '\u274C Bitte teile deinen eigenen Kontakt, nicht den einer anderen Person.')
    return
  }
  const normalized = normalizePhone(contact.phone_number)
  if (!normalized) {
    await sendMessage(ctx.chatId, '\u274C Telefonnummer konnte nicht verarbeitet werden.')
    return
  }

  const supabase = createServiceRoleClient()
  // Pull all profiles and compare normalized phone
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, phone, full_name')
  const rows = (profiles ?? []) as { id: string; phone: string | null; full_name: string }[]
  const matches = rows.filter(p => p.phone && normalizePhone(p.phone) === normalized)

  if (matches.length === 0) {
    await sendMessage(ctx.chatId, '\u274C Keine Telefonnummer gefunden. Trage sie auf /konto ein oder nutze einen Link-Code.')
    return
  }
  if (matches.length > 1) {
    await sendMessage(ctx.chatId, '\u274C Mehrere Profile mit dieser Nummer gefunden. Bitte nutze einen Link-Code von /konto.')
    return
  }

  await performLink(ctx, matches[0].id, null)
}

async function performLink(ctx: BotContext, profileId: string, usedCode: string | null): Promise<void> {
  const supabase = createServiceRoleClient()

  // Check if profile already linked elsewhere
  const { data: existing } = await supabase
    .from('bot_users')
    .select('chat_id')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existing && (existing as { chat_id: number }).chat_id !== ctx.chatId) {
    await sendMessage(ctx.chatId, '\u274C Dieses Profil ist bereits mit einem anderen Telegram verkn\u00FCpft. Dort zuerst /unlink senden.')
    return
  }

  // Fetch profile to derive bot_role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', profileId)
    .maybeSingle()
  const profileRole = (profile as { role: string; full_name: string } | null)?.role ?? 'member'
  const botRole =
    profileRole === 'owner' ? 'admin' :
    profileRole === 'coach' ? 'coach' : 'member'
  const fullName = (profile as { full_name?: string } | null)?.full_name ?? 'Unbekannt'

  const { error } = await (supabase.from('bot_users') as unknown as {
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
  }).insert({
    chat_id: ctx.chatId,
    profile_id: profileId,
    bot_role: botRole,
    telegram_username: ctx.telegramUsername,
    first_name: ctx.firstName,
  })
  if (error) {
    console.error('[bot] link insert error:', error)
    await sendMessage(ctx.chatId, '\u274C Verkn\u00FCpfung fehlgeschlagen. Bitte sp\u00E4ter erneut versuchen.')
    return
  }

  // Mark code as used if applicable
  if (usedCode) {
    await (supabase.from('bot_link_codes') as unknown as {
      update: (patch: Record<string, unknown>) => { eq: (col: string, val: unknown) => Promise<{ error: unknown }> }
    })
      .update({ used_at: new Date().toISOString(), used_by_chat_id: ctx.chatId })
      .eq('code', usedCode)
  }

  const roleLabel = FRIENDLY_ROLE[botRole]
  await sendMessage(
    ctx.chatId,
    `\u2705 Erfolgreich verkn\u00FCpft!\n\nName: ${fullName}\nRolle: ${roleLabel}\n\nNutze /help um alle Befehle zu sehen.`,
    { reply_markup: { remove_keyboard: true } },
  )
}
