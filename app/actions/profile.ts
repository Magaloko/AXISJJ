'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { profileSchema, passwordChangeSchema } from './profile.schema'
import { getActionErrors } from '@/lib/i18n/action-lang'

export async function updateProfile(
  data: z.infer<typeof profileSchema>
): Promise<{ success?: boolean; error?: string }> {
  const e = await getActionErrors()

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? e.invalidInput }
  }

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

  if (error) {
    console.error('[profile] update error:', error)
    return { error: `${e.saveFailed}: ${error.message}` }
  }

  revalidatePath('/konto')
  return { success: true }
}

export async function updateLanguage(
  lang: 'de' | 'en' | 'ru'
): Promise<{ success?: boolean; error?: string }> {
  const e = await getActionErrors()

  if (lang !== 'de' && lang !== 'en' && lang !== 'ru') return { error: e.invalidLanguage }

  const cookieStore = await cookies()
  cookieStore.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', user.id)
    if (error) {
      console.error('[profile] language update error:', error)
      return { error: `${e.saveFailed}: ${error.message}` }
    }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function changePassword(
  data: z.infer<typeof passwordChangeSchema>
): Promise<{ success?: boolean; error?: string }> {
  const e = await getActionErrors()

  const parsed = passwordChangeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? e.invalidInput }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) return { error: e.notAuthenticated }

  // Verify current password with an isolated anon client so the SSR session
  // cookies are not touched by the sign-in call.
  const verifyClient = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  })
  if (verifyError) return { error: e.wrongCurrentPassword }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  })
  if (updateError) {
    console.error('[profile] password update error:', updateError)
    return { error: `${e.passwordChangeFailed}: ${updateError.message}` }
  }

  return { success: true }
}
