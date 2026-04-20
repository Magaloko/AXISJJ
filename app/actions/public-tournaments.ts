import { createClient } from '@/lib/supabase/server'

export interface TournamentPublic {
  id: string
  name: string
  date: string
  endDate: string | null
  location: string
  type: 'internal' | 'external'
  description: string | null
  approvedParticipants: { name: string; avatarUrl: string | null }[]
}

export async function getPublicTournaments(): Promise<TournamentPublic[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, date, end_date, location, type, description,
      tournament_registrations(
        status,
        profiles(full_name, avatar_url)
      )
    `)
    .eq('status', 'approved')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(4)

  if (error || !data) return []

  return data.map(t => {
    const regs = (t.tournament_registrations ?? []) as {
      status: string
      profiles: { full_name: string | null; avatar_url: string | null } | { full_name: string | null; avatar_url: string | null }[] | null
    }[]

    const approvedParticipants = regs
      .filter(r => r.status === 'approved')
      .map(r => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        return {
          name: (p?.full_name ?? 'Athlet').split(' ')[0],
          avatarUrl: p?.avatar_url ?? null,
        }
      })

    return {
      id: t.id,
      name: t.name,
      date: t.date,
      endDate: t.end_date,
      location: t.location,
      type: t.type as 'internal' | 'external',
      description: t.description,
      approvedParticipants,
    }
  })
}
