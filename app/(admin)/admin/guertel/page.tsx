import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BeltEligibilityList } from '@/components/admin/BeltEligibilityList'
import { PromotionHistory } from '@/components/admin/PromotionHistory'
import type { PromotionReady } from '@/app/actions/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gürtel | Admin' }

export default async function GuertelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  // Fetch belts and all profile_ranks
  const [beltsResult, ranksResult] = await Promise.all([
    supabase
      .from('belt_ranks')
      .select('id, name, order, color_hex, min_sessions, min_time_months')
      .order('order', { ascending: true }),
    supabase
      .from('profile_ranks')
      .select('profile_id, belt_rank_id, promoted_at, promoted_by, profiles(full_name)')
      .order('promoted_at', { ascending: false }),
  ])

  type BeltRow = { id: string; name: string; order: number; color_hex: string | null; min_sessions: number | null; min_time_months: number | null }
  const beltList = (beltsResult.data ?? []) as BeltRow[]
  const beltById = new Map(beltList.map(b => [b.id, b]))
  const beltByOrder = new Map(beltList.map(b => [b.order, b]))

  const ranks = (ranksResult.data ?? []) as any[]

  // Eligibility: most recent rank per profile
  const latestByProfile = new Map<string, { belt_rank_id: string; promoted_at: string; full_name: string }>()
  for (const row of ranks) {
    if (latestByProfile.has(row.profile_id as string)) continue
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const profileObj = rawProfile as { full_name: string } | null
    latestByProfile.set(row.profile_id as string, {
      belt_rank_id: row.belt_rank_id as string,
      promoted_at: row.promoted_at as string,
      full_name: profileObj?.full_name ?? 'Unbekannt',
    })
  }

  const now = new Date()
  const eligible: PromotionReady[] = []
  for (const [profileId, latest] of latestByProfile) {
    const currentBelt = beltById.get(latest.belt_rank_id)
    if (!currentBelt) continue
    const nextBelt = beltByOrder.get(currentBelt.order + 1)
    if (!nextBelt) continue
    const { count: sessions } = await supabase
      .from('attendances').select('*', { count: 'exact', head: true }).eq('profile_id', profileId)
    const monthsElapsed = Math.floor((now.getTime() - new Date(latest.promoted_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    const sessionsOk = !nextBelt.min_sessions || (sessions ?? 0) >= nextBelt.min_sessions
    const monthsOk = !nextBelt.min_time_months || monthsElapsed >= nextBelt.min_time_months
    if (!sessionsOk || !monthsOk) continue
    eligible.push({
      profileId, memberName: latest.full_name,
      currentBelt: currentBelt.name, currentBeltColor: currentBelt.color_hex,
      nextBelt: nextBelt.name, nextBeltColor: nextBelt.color_hex,
      sessions: sessions ?? 0, months: monthsElapsed,
    })
  }
  eligible.sort((a, b) => b.months - a.months)

  // History: last 30 rows with "from" belt derived from the immediately-prior rank for the same profile
  const profileAscIndex = new Map<string, { belt_rank_id: string; promoted_at: string }[]>()
  for (const row of ranks) {
    const list = profileAscIndex.get(row.profile_id as string) ?? []
    list.push({ belt_rank_id: row.belt_rank_id as string, promoted_at: row.promoted_at as string })
    profileAscIndex.set(row.profile_id as string, list)
  }
  for (const list of profileAscIndex.values()) list.sort((a, b) => a.promoted_at.localeCompare(b.promoted_at))

  const promoterIds = Array.from(new Set(ranks.map(r => r.promoted_by).filter(Boolean))) as string[]
  const promoterMap = new Map<string, string>()
  if (promoterIds.length > 0) {
    const { data: promoters } = await supabase
      .from('profiles').select('id, full_name').in('id', promoterIds)
    for (const p of (promoters ?? []) as { id: string; full_name: string }[]) {
      promoterMap.set(p.id, p.full_name)
    }
  }

  const historyRows = ranks.slice(0, 30).map(row => {
    const ascList = profileAscIndex.get(row.profile_id as string) ?? []
    const currentIdx = ascList.findIndex(x => x.promoted_at === row.promoted_at && x.belt_rank_id === row.belt_rank_id)
    const prior = currentIdx > 0 ? ascList[currentIdx - 1] : null
    const priorBelt = prior ? beltById.get(prior.belt_rank_id) : null
    const toBelt = beltById.get(row.belt_rank_id as string)
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      promotedAt: row.promoted_at as string,
      memberName: (rawProfile as { full_name: string } | null)?.full_name ?? 'Unbekannt',
      fromBelt: priorBelt?.name ?? null,
      fromBeltColor: priorBelt?.color_hex ?? null,
      toBelt: toBelt?.name ?? '—',
      toBeltColor: toBelt?.color_hex ?? null,
      promotedByName: row.promoted_by ? promoterMap.get(row.promoted_by as string) ?? null : null,
    }
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Gürtelpromotions</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <BeltEligibilityList eligible={eligible} />
        <PromotionHistory rows={historyRows} />
      </div>
    </div>
  )
}
