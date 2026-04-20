import { createClient } from '@/lib/supabase/server'

export interface CoachPublicProfile {
  profileId: string
  name: string
  avatarUrl: string | null
  specialization: string | null
  bio: string | null
  achievements: string | null
  beltName: string | null
  beltColorHex: string | null
  displayOrder: number
}

export async function getPublicCoaches(): Promise<CoachPublicProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      profile_id,
      specialization,
      bio,
      achievements,
      display_order,
      profiles!inner(
        full_name,
        avatar_url,
        profile_ranks(
          promoted_at,
          belt_ranks(name, color_hex)
        )
      )
    `)
    .eq('show_on_website', true)
    .order('display_order', { ascending: true })

  if (error || !data) return []

  return data.map(row => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const ranks = (profile?.profile_ranks ?? []) as {
      promoted_at: string
      belt_ranks: { name: string; color_hex: string | null } | { name: string; color_hex: string | null }[] | null
    }[]

    const sorted = [...ranks].sort(
      (a, b) => new Date(b.promoted_at).getTime() - new Date(a.promoted_at).getTime(),
    )
    const latestRankBelts = sorted[0]?.belt_ranks ?? null
    const belt = Array.isArray(latestRankBelts) ? latestRankBelts[0] : latestRankBelts

    return {
      profileId: row.profile_id,
      name: profile?.full_name ?? 'Coach',
      avatarUrl: profile?.avatar_url ?? null,
      specialization: row.specialization,
      bio: row.bio,
      achievements: row.achievements,
      beltName: belt?.name ?? null,
      beltColorHex: belt?.color_hex ?? null,
      displayOrder: row.display_order,
    }
  })
}
