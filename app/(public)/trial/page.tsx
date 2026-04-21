import { cookies } from 'next/headers'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { createClient } from '@/lib/supabase/server'
import TrialForm from './TrialForm'

export default async function TrialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dbLang: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('language').eq('id', user.id).single()
    dbLang = data?.language ?? null
  }
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, dbLang)
  return <TrialForm lang={lang} />
}
