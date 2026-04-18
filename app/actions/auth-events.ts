'use server'

import { waitUntil } from '@vercel/functions'
import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications'

export async function logPasswordLogin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .eq('id', user.id)
    .single()
  if (!profile) return
  const createdAt = new Date((profile as { created_at: string }).created_at).getTime()
  const age = Date.now() - createdAt
  const type = age < 10_000 ? 'user.registered' : 'user.login'
  waitUntil(notify({
    type,
    data: {
      full_name: (profile as { full_name?: string }).full_name ?? 'Unbekannt',
      email: (profile as { email?: string }).email ?? '',
    },
  }))
}
