// lib/i18n/action-lang.ts
// Resolve the caller's language inside a server action. Reads cookie first,
// falls back to the authenticated user's DB profile language, finally to 'de'.

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveLang } from './resolve-lang'
import { translations, type Lang } from '.'

export async function getActionLang(): Promise<Lang> {
  let rawLang: string | undefined
  let inRequestScope = false
  try {
    rawLang = (await cookies()).get('lang')?.value
    inRequestScope = true
  } catch {
    // cookies() unavailable outside request scope (e.g. tests) — skip to default
    return 'de'
  }
  // Quick path: cookie set — use it
  if (rawLang === 'de' || rawLang === 'en' || rawLang === 'ru') return rawLang

  // Fall back to DB profile language for logged-in users
  if (inRequestScope) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single()
        return resolveLang(rawLang, data?.language)
      }
    } catch {
      // ignore — fall through to default
    }
  }
  return 'de'
}

// Shortcut to get the errors namespace for the caller's language.
export async function getActionErrors() {
  const lang = await getActionLang()
  return translations[lang].actionErrors
}
