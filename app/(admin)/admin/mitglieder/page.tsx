// app/(admin)/admin/mitglieder/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { MemberTable } from '@/components/admin/MemberTable'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mitglieder | Admin' }

export default async function MitgliederPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, language')
    .eq('id', user.id)
    .single()

  const callerRole = callerProfile?.role ?? 'member'
  const viewerRole: 'coach' | 'owner' = callerRole === 'owner' ? 'owner' : 'coach'
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, callerProfile?.language)

  // Step 1: plain profiles query — no joins, robust
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, created_at, phone, date_of_birth, role')
    .order('full_name', { ascending: true, nullsFirst: false })

  if (profilesError) {
    console.error('[mitglieder] profiles query error:', profilesError)
  }

  const memberIds = (profilesData ?? []).map(p => p.id)

  // Step 2: parallel supplementary queries, each isolated so one failure doesn't nuke the list
  const [ranksResult, beltsResult, attendancesResult] = await Promise.all([
    memberIds.length > 0
      ? supabase
          .from('profile_ranks')
          .select('profile_id, promoted_at, belt_ranks(name, stripes, color_hex)')
          .in('profile_id', memberIds)
          .order('promoted_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('belt_ranks')
      .select('id, name, color_hex')
      .order('name', { ascending: true }),
    memberIds.length > 0
      ? supabase
          .from('attendances')
          .select('profile_id, checked_in_at')
          .in('profile_id', memberIds)
          .order('checked_in_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (ranksResult.error) console.error('[mitglieder] ranks error:', ranksResult.error)
  if (beltsResult.error) console.error('[mitglieder] belts error:', beltsResult.error)
  if (attendancesResult.error) console.error('[mitglieder] attendances error:', attendancesResult.error)

  // Build: latest rank per profile
  const latestRankByProfile = new Map<string, { name: string; stripes: number; color_hex: string | null }>()
  for (const r of ranksResult.data ?? []) {
    if (latestRankByProfile.has(r.profile_id)) continue
    const belt = Array.isArray(r.belt_ranks) ? r.belt_ranks[0] : r.belt_ranks
    if (belt) {
      latestRankByProfile.set(r.profile_id, {
        name: belt.name,
        stripes: belt.stripes,
        color_hex: belt.color_hex,
      })
    }
  }

  // Last attendance per profile
  const lastAttendanceMap = new Map<string, string>()
  for (const a of attendancesResult.data ?? []) {
    if (!lastAttendanceMap.has(a.profile_id)) {
      lastAttendanceMap.set(a.profile_id, a.checked_in_at)
    }
  }

  const members = (profilesData ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    created_at: p.created_at,
    phone: p.phone ?? null,
    date_of_birth: p.date_of_birth ?? null,
    role: p.role,
    lastAttendance: lastAttendanceMap.get(p.id) ?? null,
    belt: latestRankByProfile.get(p.id) ?? null,
  }))

  const belts = (beltsResult.data ?? []).map(b => ({
    id: b.id,
    name: b.name,
    color_hex: b.color_hex,
  }))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-black text-foreground">Mitglieder</h1>
        <p className="text-xs text-muted-foreground">{members.length} Mitglied{members.length !== 1 ? 'er' : ''}</p>
      </div>
      <MemberTable members={members} belts={belts} viewerRole={viewerRole} lang={lang} />
    </div>
  )
}
