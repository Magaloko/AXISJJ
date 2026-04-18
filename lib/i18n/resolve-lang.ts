// lib/i18n/resolve-lang.ts
import type { Lang } from '.'

export function resolveLang(cookieValue: string | undefined, dbValue?: string | null): Lang {
  if (cookieValue === 'en' || dbValue === 'en') return 'en'
  return 'de'
}
