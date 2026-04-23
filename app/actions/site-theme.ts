'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_THEME, type SiteTheme } from '@/lib/site-theme'

/* eslint-disable @typescript-eslint/no-explicit-any */

function isDeveloperRole(role: string | null | undefined): boolean {
  return role === 'developer' || role === 'owner'
}

function validateHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export async function updateSiteTheme(theme: SiteTheme): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isDeveloperRole((profile as { role?: string } | null)?.role)) {
    return { error: 'Nur Developer oder Owner dürfen das Theme ändern.' }
  }

  // Validate all hex values
  for (const key of Object.keys(DEFAULT_THEME) as (keyof SiteTheme)[]) {
    if (!validateHex(theme[key])) {
      return { error: `Ungültige Farbe für ${key}: ${theme[key]}` }
    }
  }

  const { error } = await (supabase as any)
    .from('gym_settings')
    .update({ theme: theme as unknown as Record<string, string>, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function resetSiteTheme(): Promise<{ success?: true; error?: string }> {
  return updateSiteTheme(DEFAULT_THEME)
}
