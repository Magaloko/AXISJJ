'use server'

import { createClient } from '@/lib/supabase/server'

export interface CoachTodaySession {
  id: string
  starts_at: string
  ends_at: string
  location: string | null
  capacity: number
  confirmedCount: number
  className: string
}

export interface CoachStudent {
  profileId: string
  fullName: string
  visitsLast30d: number
  lastVisit: string
}

export interface CoachInsights {
  sessionsTodayCount: number
  sessionsWeekCount: number
  studentsLast30d: number
  checkinsTodayCount: number
  todaySessions: CoachTodaySession[]
  students: CoachStudent[]
  error?: string
}

export async function getCoachInsights(): Promise<CoachInsights> {
  const empty: CoachInsights = {
    sessionsTodayCount: 0, sessionsWeekCount: 0,
    studentsLast30d: 0, checkinsTodayCount: 0,
    todaySessions: [], students: [],
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...empty, error: 'Nicht eingeloggt' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'coach' && profile.role !== 'owner')) {
    return { ...empty, error: 'Keine Berechtigung.' }
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const weekEnd = new Date(todayStart); weekEnd.setDate(todayStart.getDate() + 7)

  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30)

  // My sessions today + this week
  const [{ data: todayData }, { data: weekData }] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`id, starts_at, ends_at, location, capacity, class_types(name), bookings(id, status)`)
      .eq('coach_id', user.id)
      .eq('cancelled', false)
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('class_sessions')
      .select('id', { count: 'exact', head: false })
      .eq('coach_id', user.id)
      .eq('cancelled', false)
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', weekEnd.toISOString()),
  ])

  const todaySessions: CoachTodaySession[] = (todayData ?? []).map(s => {
    const classType = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
    const confirmedCount = (s.bookings ?? []).filter(b => b.status === 'confirmed').length
    return {
      id: s.id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      location: s.location,
      capacity: s.capacity,
      confirmedCount,
      className: classType?.name ?? 'Training',
    }
  })

  // My students: profiles who attended my sessions in the last 30 days
  const { data: mySessionIds } = await supabase
    .from('class_sessions')
    .select('id')
    .eq('coach_id', user.id)
    .gte('starts_at', thirtyDaysAgo.toISOString())

  const sessionIds = (mySessionIds ?? []).map(s => s.id)
  let students: CoachStudent[] = []
  let checkinsTodayCount = 0

  if (sessionIds.length > 0) {
    const { data: attendances } = await supabase
      .from('attendances')
      .select('profile_id, checked_in_at, profiles(full_name)')
      .in('session_id', sessionIds)
      .gte('checked_in_at', thirtyDaysAgo.toISOString())
      .order('checked_in_at', { ascending: false })

    // Aggregate per profile
    const studentMap = new Map<string, CoachStudent>()
    for (const a of attendances ?? []) {
      const existing = studentMap.get(a.profile_id)
      if (existing) {
        existing.visitsLast30d += 1
      } else {
        const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
        studentMap.set(a.profile_id, {
          profileId: a.profile_id,
          fullName: profile?.full_name ?? 'Unbekannt',
          visitsLast30d: 1,
          lastVisit: a.checked_in_at,
        })
      }
    }
    students = Array.from(studentMap.values())
      .sort((a, b) => b.visitsLast30d - a.visitsLast30d)
      .slice(0, 20)

    // Check-ins today for my sessions
    const { count } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .gte('checked_in_at', todayStart.toISOString())
      .lte('checked_in_at', todayEnd.toISOString())
    checkinsTodayCount = count ?? 0
  }

  return {
    sessionsTodayCount: todaySessions.length,
    sessionsWeekCount: weekData?.length ?? 0,
    studentsLast30d: students.length,
    checkinsTodayCount,
    todaySessions,
    students,
  }
}
