'use server'

import { createClient } from '@/lib/supabase/server'

export interface LeaderboardEntry {
  rank: number
  profileId: string
  fullName: string
  attendances: number
  isMe: boolean
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const myId = user?.id ?? null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const { data: attendances } = await supabase
    .from('attendances')
    .select('profile_id')
    .gte('checked_in_at', monthStart.toISOString())
    .lte('checked_in_at', monthEnd.toISOString())

  // Aggregate count per profile
  const countMap = new Map<string, number>()
  for (const a of attendances ?? []) {
    countMap.set(a.profile_id, (countMap.get(a.profile_id) ?? 0) + 1)
  }

  if (countMap.size === 0) return []

  const ids = Array.from(countMap.keys())
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)

  const entries: LeaderboardEntry[] = (profiles ?? []).map(p => ({
    rank: 0,
    profileId: p.id,
    fullName: p.full_name ?? 'Unbekannt',
    attendances: countMap.get(p.id) ?? 0,
    isMe: p.id === myId,
  }))
  entries.sort((a, b) => b.attendances - a.attendances)
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries.slice(0, 10)
}
