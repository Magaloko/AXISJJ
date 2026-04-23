import { createClient } from '@/lib/supabase/server'

export interface SiteTheme {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  card: string
  border: string
}

export const DEFAULT_THEME: SiteTheme = {
  primary:             '#e63946',
  primaryForeground:   '#ffffff',
  secondary:           '#1a1a2e',
  secondaryForeground: '#ffffff',
  accent:              '#e63946',
  accentForeground:    '#ffffff',
  background:          '#fafaf8',
  foreground:          '#1a1a1a',
  card:                '#f4f2ef',
  border:              '#d9d6d1',
}

function isValidHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
}

function sanitize(raw: unknown): SiteTheme {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME
  const src = raw as Record<string, unknown>
  const out: SiteTheme = { ...DEFAULT_THEME }
  for (const key of Object.keys(DEFAULT_THEME) as (keyof SiteTheme)[]) {
    if (isValidHex(src[key])) out[key] = src[key] as string
  }
  return out
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getSiteTheme(): Promise<SiteTheme> {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('gym_settings')
      .select('theme')
      .eq('id', 1)
      .maybeSingle()
    return sanitize(data?.theme)
  } catch {
    return DEFAULT_THEME
  }
}

export function themeToCssVars(theme: SiteTheme): Record<string, string> {
  return {
    '--color-primary':              theme.primary,
    '--color-primary-foreground':   theme.primaryForeground,
    '--color-secondary':            theme.secondary,
    '--color-secondary-foreground': theme.secondaryForeground,
    '--color-accent':               theme.accent,
    '--color-accent-foreground':    theme.accentForeground,
    '--color-background':           theme.background,
    '--color-foreground':           theme.foreground,
    '--color-card':                 theme.card,
    '--color-card-foreground':      theme.foreground,
    '--color-border':               theme.border,
    '--gym-primary':                theme.primary,
    '--gym-secondary':              theme.secondary,
  }
}
