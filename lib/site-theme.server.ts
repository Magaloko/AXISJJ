import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_THEME, sanitizeTheme, type SiteTheme } from '@/lib/site-theme'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getSiteTheme(): Promise<SiteTheme> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('gym_settings')
      .select('theme')
      .eq('id', 1)
      .maybeSingle()
    return sanitizeTheme(data?.theme)
  } catch {
    return DEFAULT_THEME
  }
}
