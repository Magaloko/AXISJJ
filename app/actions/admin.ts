'use server'

import { createClient } from '@/lib/supabase/server'

export interface TodaySession {
  id: string
  starts_at: string
  ends_at: string
  cancelled: boolean
  location: string | null
  class_types: { name: string } | null
  confirmedCount: number
  capacity: number
}

export interface BookingWithAttendance {
  id: string
  profile_id: string
  status: string
  memberName: string
  checkedInAt: string | null
}

export async function getTodaySessions(): Promise<{
  sessions?: TodaySession[]
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, cancelled, location, capacity,
      class_types(name),
      bookings(id, status)
    `)
    .eq('cancelled', false)
    .gte('starts_at', todayStart.toISOString())
    .lte('starts_at', todayEnd.toISOString())
    .order('starts_at', { ascending: true })

  if (error) return { error: 'Daten konnten nicht geladen werden.' }

  const sessions: TodaySession[] = (data ?? []).map((s: Record<string, unknown>) => {
    const bookingsArr = Array.isArray(s.bookings) ? s.bookings as { status: string }[] : []
    const confirmedCount = bookingsArr.filter(b => b.status === 'confirmed').length
    const rawCt = s.class_types
    const classType = Array.isArray(rawCt) ? rawCt[0] : rawCt
    return {
      id: s.id as string,
      starts_at: s.starts_at as string,
      ends_at: s.ends_at as string,
      cancelled: s.cancelled as boolean,
      location: s.location as string | null,
      capacity: s.capacity as number,
      class_types: classType ? { name: (classType as { name: string }).name } : null,
      confirmedCount,
    }
  })

  return { sessions }
}

export async function getSessionBookings(sessionId: string): Promise<{
  bookings?: BookingWithAttendance[]
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const [bookingsResult, attendancesResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, profile_id, status, profiles(full_name)')
      .eq('session_id', sessionId)
      .eq('status', 'confirmed')
      .order('profiles(full_name)', { ascending: true }),
    supabase
      .from('attendances')
      .select('profile_id, checked_in_at')
      .eq('session_id', sessionId),
  ])

  if (bookingsResult.error) return { error: 'Buchungen konnten nicht geladen werden.' }

  const attendanceMap = new Map<string, string>()
  for (const a of attendancesResult.data ?? []) {
    attendanceMap.set(a.profile_id, a.checked_in_at)
  }

  const bookings: BookingWithAttendance[] = (bookingsResult.data ?? []).map((b: Record<string, unknown>) => {
    const rawProfile = b.profiles
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
    return {
      id: b.id as string,
      profile_id: b.profile_id as string,
      status: b.status as string,
      memberName: (profile as { full_name: string } | null)?.full_name ?? 'Unbekannt',
      checkedInAt: attendanceMap.get(b.profile_id as string) ?? null,
    }
  })

  // Sort: not checked-in first, then checked-in
  bookings.sort((a, b) => {
    if (a.checkedInAt && !b.checkedInAt) return 1
    if (!a.checkedInAt && b.checkedInAt) return -1
    return a.memberName.localeCompare(b.memberName)
  })

  return { bookings }
}

export async function getAdminDashboard(role: 'coach' | 'owner'): Promise<{
  checkinsToday: number
  bookingsToday: number
  todaySessions: TodaySession[]
  activeMembers?: number
  newLeads?: number
  promotionsReady?: { profileId: string; memberName: string; currentBelt: string; nextBelt: string }[]
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt', checkinsToday: 0, bookingsToday: 0, todaySessions: [] }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [checkinsResult, bookingsResult, sessionsResult] = await Promise.all([
    supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .gte('checked_in_at', todayStart.toISOString())
      .lte('checked_in_at', todayEnd.toISOString()),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('class_sessions')
      .select(`id, starts_at, ends_at, cancelled, location, capacity, class_types(name), bookings(id, status)`)
      .eq('cancelled', false)
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .order('starts_at', { ascending: true }),
  ])

  const todaySessions: TodaySession[] = (sessionsResult.data ?? []).map((s: Record<string, unknown>) => {
    const bookingsArr = Array.isArray(s.bookings) ? s.bookings as { status: string }[] : []
    const confirmedCount = bookingsArr.filter(b => b.status === 'confirmed').length
    const rawCt = s.class_types
    const classType = Array.isArray(rawCt) ? rawCt[0] : rawCt
    return {
      id: s.id as string,
      starts_at: s.starts_at as string,
      ends_at: s.ends_at as string,
      cancelled: s.cancelled as boolean,
      location: s.location as string | null,
      capacity: s.capacity as number,
      class_types: classType ? { name: (classType as { name: string }).name } : null,
      confirmedCount,
    }
  })

  const base = {
    checkinsToday: checkinsResult.count ?? 0,
    bookingsToday: bookingsResult.count ?? 0,
    todaySessions,
  }

  if (role !== 'owner') return base

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [membersResult, leadsResult, promotionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .gte('created_at', weekAgo),
    supabase
      .from('profile_ranks')
      .select(`
        profile_id,
        promoted_at,
        profiles(full_name),
        belt_ranks(name, min_sessions, min_time_months)
      `)
      .order('promoted_at', { ascending: false }),
  ])

  const now = new Date()
  const promotionsReady: { profileId: string; memberName: string; currentBelt: string; nextBelt: string }[] = []

  for (const row of promotionsResult.data ?? []) {
    const rawBelt = Array.isArray(row.belt_ranks) ? row.belt_ranks[0] : row.belt_ranks
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!rawBelt || !rawProfile) continue
    const belt = rawBelt as { name: string; min_sessions: number | null; min_time_months: number | null }
    const profile = rawProfile as { full_name: string }
    if (!belt.min_time_months || !row.promoted_at) continue
    const monthsElapsed = Math.floor((now.getTime() - new Date(row.promoted_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (monthsElapsed >= belt.min_time_months) {
      promotionsReady.push({
        profileId: row.profile_id as string,
        memberName: profile.full_name ?? 'Unbekannt',
        currentBelt: belt.name,
        nextBelt: '—',
      })
    }
  }

  return {
    ...base,
    activeMembers: membersResult.count ?? 0,
    newLeads: leadsResult.count ?? 0,
    promotionsReady,
  }
}
