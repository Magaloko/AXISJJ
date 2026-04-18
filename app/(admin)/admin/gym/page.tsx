import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGymSettings } from '@/lib/gym-settings'
import { GymInfoForm } from '@/components/admin/GymInfoForm'
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm'
import { PoliciesForm } from '@/components/admin/PoliciesForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gym | Admin' }

export default async function AdminGymPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const settings = await getGymSettings()

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Gym</h1>
      <div className="space-y-6">
        <GymInfoForm initial={settings} />
        <div className="grid gap-6 lg:grid-cols-2">
          <OpeningHoursForm initial={settings.opening_hours} />
          <PoliciesForm initial={settings} />
        </div>
      </div>
    </div>
  )
}
