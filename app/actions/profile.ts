'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { profileSchema } from './profile.schema'

export async function updateProfile(
  data: z.infer<typeof profileSchema>
): Promise<{ success?: boolean; error?: string }> {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq('id', user.id)

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/members/konto')
  return { success: true }
}

export async function updateLanguage(
  lang: 'de' | 'en'
): Promise<{ success?: boolean; error?: string }> {
  if (lang !== 'de' && lang !== 'en') return { error: 'Ungültige Sprache.' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('profiles')
    .update({ language: lang })
    .eq('id', user.id)

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  const cookieStore = await cookies()
  cookieStore.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false })

  revalidatePath('/members', 'layout')
  return { success: true }
}
