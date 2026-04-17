// app/(members)/gürtel/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BeltProgress } from '@/components/members/BeltProgress'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gürtel' }

interface BeltRankRow {
  id: string; name: string; stripes: number; order: number
  color_hex: string | null; min_sessions: number | null; min_time_months: number | null
}

export default async function GuertelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  // Latest promotion (highest belt_rank order)
  const { data: rankHistory } = await supabase
    .from('profile_ranks')
    .select('promoted_at, belt_ranks(id, name, stripes, order, color_hex, min_sessions, min_time_months)')
    .eq('profile_id', userId)
    .order('promoted_at', { ascending: false })
    .limit(1)

  const latestRow = rankHistory?.[0] ?? null
  const rawBeltRank = latestRow?.belt_ranks
  const beltRank: BeltRankRow | null = Array.isArray(rawBeltRank)
    ? (rawBeltRank[0] ?? null)
    : (rawBeltRank as BeltRankRow | null) ?? null

  const monthsInGrade = latestRow?.promoted_at
    ? differenceInMonths(new Date(), new Date(latestRow.promoted_at))
    : 0

  const { count: sessionsAttended } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  const totalSessions = sessionsAttended ?? 0
  const readiness = calcReadiness(
    totalSessions,
    beltRank?.min_sessions ?? null,
    monthsInGrade,
    beltRank?.min_time_months ?? null
  )

  // Full rank history for the timeline
  const { data: allRanks } = await supabase
    .from('profile_ranks')
    .select('promoted_at, belt_ranks(name, stripes, color_hex)')
    .eq('profile_id', userId)
    .order('promoted_at', { ascending: false })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Gürtel</h1>

      <div className="max-w-lg space-y-6">
        <BeltProgress
          beltName={beltRank?.name ?? null}
          stripes={beltRank?.stripes ?? 0}
          colorHex={beltRank?.color_hex ?? null}
          readiness={readiness}
          sessionsAttended={totalSessions}
          monthsInGrade={monthsInGrade}
        />

        {/* Rank history */}
        {allRanks && allRanks.length > 1 && (
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">Verlauf</p>
            <div className="space-y-3">
              {allRanks.map((row, i) => {
                const raw = row.belt_ranks
                const rank = Array.isArray(raw) ? raw[0] : raw as { name: string; stripes: number; color_hex: string | null } | null
                if (!rank) return null
                return (
                  <div key={row.promoted_at ?? i} className="flex items-center gap-3">
                    <div
                      className="h-2 w-10 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: rank.color_hex ?? '#e5e7eb', border: rank.color_hex === '#111111' ? '1px solid #dc2626' : undefined }}
                    />
                    <span className="text-sm text-white">{rank.name} · {rank.stripes} Stripes</span>
                    <span className="ml-auto text-xs text-gray-600">
                      {row.promoted_at ? new Date(row.promoted_at).toLocaleDateString('de-AT', { year: 'numeric', month: 'long' }) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
