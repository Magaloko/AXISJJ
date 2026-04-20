'use server'

import { createClient } from '@/lib/supabase/server'

export interface TrainingPartner {
  profileId: string
  fullName: string
  beltName: string | null
  beltColor: string | null
  stripes: number
  attendancesLast30d: number
}

/**
 * Returns up to 10 other members with the same belt rank as the logged-in user,
 * sorted by recent activity (attendances in last 30 days).
 */
export async function getTrainingPartners(): Promise<TrainingPartner[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Current user's latest belt rank
  const { data: myRank } = await supabase
    .from('profile_ranks')
    .select('belt_rank_id')
    .eq('profile_id', user.id)
    .order('promoted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!myRank) return []

  // All members who share that belt rank
  const { data: sameRankRows } = await supabase
    .from('profile_ranks')
    .select('profile_id, belt_ranks(name, color_hex, stripes)')
    .eq('belt_rank_id', myRank.belt_rank_id)

  const partnerIds = Array.from(
    new Set((sameRankRows ?? []).map(r => r.profile_id))
  ).filter(id => id !== user.id)
  if (partnerIds.length === 0) return []

  const [{ data: profiles }, { data: recentAtts }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', partnerIds),
    supabase
      .from('attendances')
      .select('profile_id')
      .in('profile_id', partnerIds)
      .gte('checked_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const attCount = new Map<string, number>()
  for (const a of recentAtts ?? []) {
    attCount.set(a.profile_id, (attCount.get(a.profile_id) ?? 0) + 1)
  }

  // Take belt info from first match
  const firstRow = (sameRankRows ?? [])[0]
  const rawBelt = firstRow?.belt_ranks
  const beltInfo = Array.isArray(rawBelt) ? rawBelt[0] : rawBelt

  const partners: TrainingPartner[] = (profiles ?? []).map(p => ({
    profileId: p.id,
    fullName: p.full_name ?? 'Unbekannt',
    beltName: beltInfo?.name ?? null,
    beltColor: beltInfo?.color_hex ?? null,
    stripes: beltInfo?.stripes ?? 0,
    attendancesLast30d: attCount.get(p.id) ?? 0,
  }))

  partners.sort((a, b) => b.attendancesLast30d - a.attendancesLast30d)
  return partners.slice(0, 10)
}
