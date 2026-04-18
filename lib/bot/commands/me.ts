import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { formatDateDE, friendlyRoleDE } from './_format'

export const meCommand: Command = {
  name: 'me',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx) => {
    if (!ctx.profile || !ctx.botUser) {
      await sendMessage(ctx.chatId, 'Fehler: Profildaten nicht verf\u00FCgbar.')
      return
    }
    const supabase = createServiceRoleClient()
    // Current belt
    const { data: rank } = await supabase
      .from('profile_ranks')
      .select('belt_ranks(name, stripes)')
      .eq('profile_id', ctx.profile.id)
      .order('promoted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const beltData = rank && (rank as any).belt_ranks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (Array.isArray((rank as any).belt_ranks) ? (rank as any).belt_ranks[0] : (rank as any).belt_ranks)
      : null
    const belt = beltData
      ? `${beltData.name} (${beltData.stripes} Streifen)`
      : '\u2014'

    const lines = [
      '\u{1F464} Deine Daten',
      '',
      `Name:      ${ctx.profile.full_name}`,
      `Rolle:     ${friendlyRoleDE(ctx.role)}`,
      `E-Mail:    ${ctx.profile.email}`,
      `G\u00FCrtel:    ${belt}`,
      `Mitglied seit: ${formatDateDE(ctx.profile.created_at)}`,
      '',
      ctx.telegramUsername ? `Telegram:  @${ctx.telegramUsername}` : `Telegram:  (kein Username)`,
      `Verkn\u00FCpft seit: ${formatDateDE(ctx.botUser.linked_at)}`,
    ]
    await sendMessage(ctx.chatId, lines.join('\n'))
  },
}
