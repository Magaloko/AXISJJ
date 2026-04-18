import { createServiceRoleClient } from '@/lib/supabase/service'
import type { BotContext, BotUserRow, EffectiveRole, ProfileLite, TelegramUser } from './types'

export async function resolveContext(
  chatId: number,
  from: TelegramUser,
): Promise<BotContext> {
  const supabase = createServiceRoleClient()

  const { data: botUserRow } = await supabase
    .from('bot_users')
    .select('chat_id, profile_id, bot_role, telegram_username, first_name, linked_at')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (!botUserRow) {
    return {
      chatId,
      telegramUserId: from.id,
      telegramUsername: from.username ?? null,
      firstName: from.first_name ?? null,
      botUser: null,
      profile: null,
      role: 'unlinked',
    }
  }

  const bu = botUserRow as BotUserRow
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone, created_at')
    .eq('id', bu.profile_id)
    .maybeSingle()

  return {
    chatId,
    telegramUserId: from.id,
    telegramUsername: from.username ?? null,
    firstName: from.first_name ?? null,
    botUser: bu,
    profile: (profileRow as ProfileLite | null) ?? null,
    role: bu.bot_role as EffectiveRole,
  }
}
