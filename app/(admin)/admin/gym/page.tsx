import { isOwnerLevel } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getGymSettings } from '@/lib/gym-settings'
import { GymInfoForm } from '@/components/admin/GymInfoForm'
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm'
import { PoliciesForm } from '@/components/admin/PoliciesForm'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { translations } from '@/lib/i18n'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gym | Admin' }

export default async function AdminGymPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role, language').eq('id', user.id).single()
  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, profile?.language)
  const t = translations[lang].admin

  const settings = await getGymSettings()

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">{t.gym.title}</h1>
      <div className="space-y-6">
        <GymInfoForm initial={settings} lang={lang} />
        <div className="grid gap-6 lg:grid-cols-2">
          <OpeningHoursForm initial={settings.opening_hours} lang={lang} />
          <PoliciesForm initial={settings} lang={lang} />
        </div>
      </div>
    </div>
  )
}
