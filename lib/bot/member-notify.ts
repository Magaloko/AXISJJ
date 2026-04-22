// Member-targeted Telegram push.
//
// Looks up the member's linked chat_id from bot_users and forwards to the
// existing sendMessage wrapper. No-op if the member hasn't linked Telegram
// yet — callers always call this best-effort, never as the only notification
// channel.

import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendMessage } from './telegram-api'

interface Options {
  parseMode?: 'MarkdownV2' | 'HTML'
}

export async function sendTelegramToMember(
  profileId: string,
  text: string,
  options?: Options,
): Promise<{ sent: boolean }> {
  if (!profileId || !text) return { sent: false }
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('bot_users')
      .select('chat_id')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) {
      console.error('[bot/member-notify] lookup error:', error)
      return { sent: false }
    }
    if (!data?.chat_id) return { sent: false }
    await sendMessage(Number(data.chat_id), text, {
      parse_mode: options?.parseMode,
    })
    return { sent: true }
  } catch (err) {
    console.error('[bot/member-notify] error:', err)
    return { sent: false }
  }
}
