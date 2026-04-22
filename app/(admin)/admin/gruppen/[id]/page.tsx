// app/(admin)/admin/gruppen/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getGroupStats } from '@/app/actions/training-groups'
import { getSparringRecords } from '@/app/actions/sparring'
import { GroupDetailClient } from '@/components/admin/groups/GroupDetailClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gruppe | Admin' }

interface Props { params: Promise<{ id: string }> }

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['coach', 'owner', 'developer'].includes(profile.role)) redirect('/admin/dashboard')

  const stats = await getGroupStats(id)
  if (!stats) notFound()

  // Sparring records for members in this group
  const memberIds = stats.members.map(m => m.profile_id)
  const sparringRecords = await getSparringRecords(memberIds)

  // All profiles for add-member selector
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'member')
    .order('full_name', { ascending: true })

  const isOwner = ['owner', 'developer'].includes(profile.role)

  return (
    <div className="p-6 sm:p-8">
      <GroupDetailClient
        stats={stats}
        sparringRecords={sparringRecords}
        allProfiles={(allProfiles ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name }))}
        isOwner={isOwner}
      />
    </div>
  )
}
