// Client-safe: types, defaults, CSS-var helper. No server-only imports.

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
  radius: string
  headingFont: string
}

export const COLOR_KEYS: (keyof SiteTheme)[] = [
  'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
  'accent', 'accentForeground', 'background', 'foreground', 'card', 'border',
]

export const RADIUS_PRESETS = [
  { value: '0rem',    label: 'Eckig' },
  { value: '0.25rem', label: 'Leicht' },
  { value: '0.5rem',  label: 'Mittel' },
  { value: '0.75rem', label: 'Rund' },
  { value: '1rem',    label: 'Sehr rund' },
] as const

export const VALID_RADII = RADIUS_PRESETS.map(p => p.value)
export const VALID_FONTS = ['sans', 'serif'] as const

export const DARK_THEME: SiteTheme = {
  primary:             '#e8000f',
  primaryForeground:   '#ffffff',
  secondary:           '#1a1a1a',
  secondaryForeground: '#ffffff',
  accent:              '#e8000f',
  accentForeground:    '#ffffff',
  background:          '#0a0a0a',
  foreground:          '#f5f5f5',
  card:                '#141414',
  border:              '#2a2a2a',
  radius:              '0rem',
  headingFont:         'sans',
}

export const LIGHT_THEME: SiteTheme = {
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
  radius:              '0rem',
  headingFont:         'sans',
}

// Default: dark mode
export const DEFAULT_THEME: SiteTheme = DARK_THEME

// Heuristic: determine if a theme is "dark" based on background luminance
export function isDarkTheme(theme: SiteTheme): boolean {
  const hex = theme.background.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export function isValidHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
}

export function sanitizeTheme(raw: unknown): SiteTheme {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME
  const src = raw as Record<string, unknown>
  const out: SiteTheme = { ...DEFAULT_THEME }
  for (const key of COLOR_KEYS) {
    if (isValidHex(src[key])) out[key] = src[key] as string
  }
  if ((VALID_RADII as readonly string[]).includes(src.radius as string)) out.radius = src.radius as string
  if ((VALID_FONTS as readonly string[]).includes(src.headingFont as string)) out.headingFont = src.headingFont as string
  return out
}

export function themeToCssVars(theme: SiteTheme): Record<string, string> {
  const fontHeading = theme.headingFont === 'serif'
    ? 'var(--font-instrument-serif), Georgia, serif'
    : 'var(--font-inter-tight), system-ui, sans-serif'

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
    '--radius':                     theme.radius,
    '--font-heading':               fontHeading,
  }
}
