// app/(admin)/admin/mitglieder/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberTable } from '@/components/admin/MemberTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mitglieder | Admin' }

export default async function MitgliederPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const callerRole = (callerProfile?.role as string | undefined) ?? 'member'
  const viewerRole: 'coach' | 'owner' = callerRole === 'owner' ? 'owner' : 'coach'

  const [profilesResult, beltsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, full_name, created_at, phone, date_of_birth, role,
        profile_ranks(promoted_at, belt_ranks(name, stripes, color_hex))
      `)
      .eq('role', 'member')
      .order('full_name', { ascending: true }),
    supabase
      .from('belt_ranks')
      .select('id, name, color_hex')
      .order('name', { ascending: true }),
  ])

  const memberIds = (profilesResult.data ?? []).map(p => p.id as string)

  // Get last attendance per member
  const { data: lastAttendances } = memberIds.length > 0
    ? await supabase
        .from('attendances')
        .select('profile_id, checked_in_at')
        .in('profile_id', memberIds)
        .order('checked_in_at', { ascending: false })
    : { data: [] }

  const lastAttendanceMap = new Map<string, string>()
  for (const a of lastAttendances ?? []) {
    if (!lastAttendanceMap.has(a.profile_id)) {
      lastAttendanceMap.set(a.profile_id, a.checked_in_at)
    }
  }

  const members = (profilesResult.data ?? []).map((p: Record<string, unknown>) => {
    const ranks = Array.isArray(p.profile_ranks)
      ? p.profile_ranks as { promoted_at: string; belt_ranks: unknown }[]
      : p.profile_ranks
      ? [p.profile_ranks as { promoted_at: string; belt_ranks: unknown }]
      : []

    const latestRank = ranks.sort((a, b) => b.promoted_at.localeCompare(a.promoted_at))[0]
    const rawBelt = latestRank?.belt_ranks
    const belt = Array.isArray(rawBelt) ? rawBelt[0] : rawBelt

    return {
      id: p.id as string,
      full_name: p.full_name as string | null,
      created_at: p.created_at as string,
      phone: (p.phone as string | null) ?? null,
      date_of_birth: (p.date_of_birth as string | null) ?? null,
      role: ((p.role as string) ?? 'member') as 'member' | 'coach' | 'owner',
      lastAttendance: lastAttendanceMap.get(p.id as string) ?? null,
      belt: belt ? {
        name: (belt as { name: string; stripes: number; color_hex: string | null }).name,
        stripes: (belt as { name: string; stripes: number; color_hex: string | null }).stripes,
        color_hex: (belt as { name: string; stripes: number; color_hex: string | null }).color_hex,
      } : null,
    }
  })

  const belts = (beltsResult.data ?? []).map(b => ({
    id: b.id as string,
    name: b.name as string,
    color_hex: b.color_hex as string | null,
  }))

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Mitglieder</h1>
      <MemberTable members={members} belts={belts} viewerRole={viewerRole} />
    </div>
  )
}
