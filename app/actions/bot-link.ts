'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L

function generateCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export async function generateBotLinkCode(): Promise<{ code?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  // Already linked?
  const { data: existingLink } = await supabase
    .from('bot_users')
    .select('chat_id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (existingLink) {
    return { error: 'Dein Profil ist bereits mit Telegram verknüpft. Sende /unlink im Bot um zu entknüpfen.' }
  }

  // Reuse existing unexpired, unused code if any
  const nowIso = new Date().toISOString()
  const { data: existingCode } = await supabase
    .from('bot_link_codes')
    .select('code, expires_at')
    .eq('profile_id', user.id)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existingCode && typeof (existingCode as { code?: unknown }).code === 'string') {
    return { code: (existingCode as { code: string }).code }
  }

  // Rate limit: max 5 generations per hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('bot_link_codes')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .gt('created_at', hourAgo)
  if ((count ?? 0) >= 5) {
    return { error: 'Zu viele Code-Anfragen. Bitte in einer Stunde erneut versuchen.' }
  }

  // Generate new
  const code = generateCode()
  const { error } = await (supabase.from('bot_link_codes') as unknown as { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> })
    .insert({ code, profile_id: user.id })
  if (error) {
    console.error('[bot-link] insert error:', error)
    return { error: 'Code-Erzeugung fehlgeschlagen.' }
  }

  revalidatePath('/konto')
  return { code }
}

export async function unlinkBotAccount(): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('bot_users')
    .delete()
    .eq('profile_id', user.id)
  if (error) return { error: 'Entknüpfen fehlgeschlagen.' }

  revalidatePath('/konto')
  return { success: true }
}
