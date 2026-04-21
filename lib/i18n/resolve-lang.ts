// lib/i18n/resolve-lang.ts
import type { Lang } from '.'

export function resolveLang(cookieValue: string | undefined, dbValue?: string | null): Lang {
  // Cookie wins over DB preference (active switch by user)
  if (cookieValue === 'en' || cookieValue === 'ru' || cookieValue === 'de') return cookieValue
  if (dbValue === 'en' || dbValue === 'ru' || dbValue === 'de') return dbValue
  return 'de'
}
