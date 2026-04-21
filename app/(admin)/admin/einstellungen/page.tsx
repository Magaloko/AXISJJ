import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ClassTypeTable } from '@/components/admin/ClassTypeTable'
import { RoleManager } from '@/components/admin/RoleManager'
import { InviteCoachForm } from '@/components/admin/InviteCoachForm'
import { BulkEmailForm } from '@/components/admin/BulkEmailForm'
import { PricingEditor } from '@/components/admin/PricingEditor'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { translations } from '@/lib/i18n'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Einstellungen | Admin' }

export default async function EinstellungenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role, language').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, profile?.language)
  const t = translations[lang].admin

  const [classTypesResult, coachesResult, membersResult, pricingResult] = await Promise.all([
    supabase.from('class_types').select('id, name, description, level, gi, image_url').order('name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'coach').order('full_name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'member').order('full_name'),
    supabase.from('pricing_plans').select('id, category, duration_months, price_per_month, total_price, highlighted').order('category').order('duration_months', { ascending: false }),
  ])

  const types = (classTypesResult.data ?? []) as {
    id: string; name: string; description: string | null;
    level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean; image_url: string | null
  }[]
  const coaches = (coachesResult.data ?? []) as { id: string; full_name: string; role: 'coach' }[]
  const members = (membersResult.data ?? []) as { id: string; full_name: string; role: 'member' }[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">{t.einstellungen.title}</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassTypeTable types={types} lang={lang} />
        <div className="space-y-6">
          <InviteCoachForm />
          <RoleManager coaches={coaches} members={members} lang={lang} />
        </div>
      </div>

      <div className="mt-6">
        <PricingEditor plans={(pricingResult.data ?? []).map(p => ({
          id: p.id,
          category: p.category,
          duration_months: p.duration_months,
          price_per_month: Number(p.price_per_month),
          total_price: p.total_price !== null ? Number(p.total_price) : null,
          highlighted: p.highlighted,
        }))} lang={lang} />
      </div>

      <div className="mt-6">
        <BulkEmailForm />
      </div>
    </div>
  )
}
