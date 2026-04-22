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
  isPinned: boolean
}

export async function getPublicCoaches(): Promise<CoachPublicProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      id,
      profile_id,
      display_name,
      avatar_url,
      belt_name,
      belt_color_hex,
      specialization,
      bio,
      achievements,
      display_order,
      is_pinned,
      profiles(
        full_name,
        avatar_url,
        profile_ranks(
          promoted_at,
          belt_ranks(name, color_hex)
        )
      )
    `)
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
    const profileBelt = Array.isArray(latestRankBelts) ? latestRankBelts[0] : latestRankBelts

    // Prefer linked profile data, fall back to standalone coach_profiles fields
    return {
      profileId: row.profile_id ?? row.id,
      name: profile?.full_name ?? row.display_name ?? 'Coach',
      avatarUrl: profile?.avatar_url ?? row.avatar_url ?? null,
      specialization: row.specialization,
      bio: row.bio,
      achievements: row.achievements,
      beltName: profileBelt?.name ?? row.belt_name ?? null,
      beltColorHex: profileBelt?.color_hex ?? row.belt_color_hex ?? null,
      displayOrder: row.display_order,
      isPinned: Boolean(row.is_pinned),
    }
  })
}
