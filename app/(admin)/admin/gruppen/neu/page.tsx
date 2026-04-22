// app/(admin)/admin/gruppen/neu/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateGroupForm } from '@/components/admin/groups/CreateGroupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Neue Gruppe | Admin' }

export default async function NeueGruppePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'developer'].includes(profile.role)) redirect('/admin/gruppen')

  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['coach', 'owner'])
    .order('full_name', { ascending: true })

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Gruppen</p>
        <h1 className="text-2xl font-black text-foreground">Neue Gruppe anlegen</h1>
      </div>
      <CreateGroupForm
        coaches={(coaches ?? []).map((c: any) => ({ id: c.id, name: c.full_name }))}
      />
    </div>
  )
}
