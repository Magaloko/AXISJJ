import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassTypeTable } from '@/components/admin/ClassTypeTable'
import { RoleManager } from '@/components/admin/RoleManager'
import { InviteCoachForm } from '@/components/admin/InviteCoachForm'
import { BulkEmailForm } from '@/components/admin/BulkEmailForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Einstellungen | Admin' }

export default async function EinstellungenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const [classTypesResult, coachesResult, membersResult] = await Promise.all([
    supabase.from('class_types').select('id, name, description, level, gi').order('name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'coach').order('full_name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'member').order('full_name'),
  ])

  const types = (classTypesResult.data ?? []) as {
    id: string; name: string; description: string | null;
    level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean
  }[]
  const coaches = (coachesResult.data ?? []) as { id: string; full_name: string; role: 'coach' }[]
  const members = (membersResult.data ?? []) as { id: string; full_name: string; role: 'member' }[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Einstellungen</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassTypeTable types={types} />
        <div className="space-y-6">
          <InviteCoachForm />
          <RoleManager coaches={coaches} members={members} />
        </div>
      </div>

      <div className="mt-6">
        <BulkEmailForm />
      </div>
    </div>
  )
}
