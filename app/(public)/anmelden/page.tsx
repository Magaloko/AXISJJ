import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { createClient } from '@/lib/supabase/server'
import MembershipForm from './MembershipForm'

export const metadata: Metadata = {
  title: 'Mitglied werden | AXIS Jiu-Jitsu Vienna',
  description: 'Jetzt Mitglied werden bei AXIS Jiu-Jitsu Vienna. Online anmelden oder Vertrag als PDF herunterladen.',
}

export default async function AnmeldenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dbLang: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('language').eq('id', user.id).single()
    dbLang = data?.language ?? null
  }
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, dbLang)
  return <MembershipForm lang={lang} />
}
