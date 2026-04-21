'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { profileSchema } from './profile.schema'
import { getActionErrors } from '@/lib/i18n/action-lang'

export async function updateProfile(
  data: z.infer<typeof profileSchema>
): Promise<{ success?: boolean; error?: string }> {
  const e = await getActionErrors()

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: e.invalidInput }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: e.notAuthenticated }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq('id', user.id)

  if (error) return { error: e.saveFailed }

  revalidatePath('/konto')
  return { success: true }
}

export async function updateLanguage(
  lang: 'de' | 'en' | 'ru'
): Promise<{ success?: boolean; error?: string }> {
  const e = await getActionErrors()

  if (lang !== 'de' && lang !== 'en' && lang !== 'ru') return { error: e.invalidLanguage }

  // Always set cookie (works for logged-out users too)
  const cookieStore = await cookies()
  cookieStore.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false })

  // If logged in, also persist to profile
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', user.id)
    if (error) return { error: e.saveFailed }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
