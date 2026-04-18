import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

export const unlinkCommand: Command = {
  name: 'unlink',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx) => {
    const supabase = createServiceRoleClient()
    const { error } = await supabase.from('bot_users').delete().eq('chat_id', ctx.chatId)
    if (error) {
      await sendMessage(ctx.chatId, '\u274C Entkn\u00FCpfen fehlgeschlagen.')
      return
    }
    await sendMessage(ctx.chatId, '\u2705 Verkn\u00FCpfung entfernt. Der Bot kennt dein Profil nicht mehr.')
  },
}
