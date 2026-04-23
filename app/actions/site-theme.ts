'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_THEME, COLOR_KEYS, VALID_RADII, VALID_FONTS, type SiteTheme } from '@/lib/site-theme'

/* eslint-disable @typescript-eslint/no-explicit-any */

function isDeveloperRole(role: string | null | undefined): boolean {
  return role === 'developer' || role === 'owner'
}

function validateHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export async function updateSiteTheme(theme: SiteTheme): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isDeveloperRole((profile as { role?: string } | null)?.role)) {
    return { error: 'Nur Developer oder Owner dürfen das Theme ändern.' }
  }

  // Validate hex color fields
  for (const key of COLOR_KEYS) {
    if (!validateHex(theme[key] as string)) {
      return { error: `Ungültige Farbe für ${key}: ${theme[key]}` }
    }
  }

  // Validate non-color fields
  if (!(VALID_RADII as readonly string[]).includes(theme.radius)) {
    return { error: `Ungültiger Radius: ${theme.radius}` }
  }
  if (!(VALID_FONTS as readonly string[]).includes(theme.headingFont)) {
    return { error: `Ungültige Schriftart: ${theme.headingFont}` }
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
