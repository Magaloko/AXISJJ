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
  if (attendancesResult.error) return { error: 'Anwesenheitsdaten konnten nicht geladen werden.' }

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

export interface PromotionReady {
  profileId: string
  memberName: string
  currentBelt: string
  currentBeltColor: string | null
  nextBelt: string
  nextBeltColor: string | null
  sessions: number
  months: number
}

export interface LeadCard {
  id: string
  full_name: string
  source: 'website' | 'instagram'
  status: 'new' | 'contacted' | 'converted' | 'lost'
  created_at: string
}

export interface LeadsByStatus {
  new: LeadCard[]
  contacted: LeadCard[]
  converted: LeadCard[]
  lost: LeadCard[]
  totals: { new: number; contacted: number; converted: number; lost: number }
}

export async function getAdminDashboard(): Promise<{
  role: 'coach' | 'owner'
  checkinsToday: number
  bookingsToday: number
  todaySessions: TodaySession[]
  activeMembers?: number
  newLeads?: number
  promotionsReady?: PromotionReady[]
  leadsByStatus?: LeadsByStatus
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt', role: 'coach', checkinsToday: 0, bookingsToday: 0, todaySessions: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as 'coach' | 'owner' | undefined
  if (!role || !['coach', 'owner'].includes(role)) {
    return { error: 'Keine Berechtigung.', role: 'coach', checkinsToday: 0, bookingsToday: 0, todaySessions: [] }
  }

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
    role: role as 'coach' | 'owner',
    checkinsToday: checkinsResult.count ?? 0,
    bookingsToday: bookingsResult.count ?? 0,
    todaySessions,
  }

  if (role !== 'owner') return base

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [membersResult, leadsResult, promotionsResult, beltsResult, allLeadsResult] = await Promise.all([
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
      .select(`profile_id, belt_rank_id, promoted_at, profiles(full_name)`)
      .order('promoted_at', { ascending: false }),
    supabase
      .from('belt_ranks')
      .select('id, name, order, color_hex, min_sessions, min_time_months')
      .order('order', { ascending: true }),
    supabase
      .from('leads')
      .select('id, full_name, source, status, created_at')
      .order('created_at', { ascending: false }),
  ])

  type BeltRow = { id: string; name: string; order: number; color_hex: string | null; min_sessions: number | null; min_time_months: number | null }
  const beltList = (beltsResult.data ?? []) as BeltRow[]
  const beltById = new Map(beltList.map(b => [b.id, b]))
  const beltByOrder = new Map(beltList.map(b => [b.order, b]))

  const now = new Date()

  // Group profile_ranks by profile, pick the most recent row per profile
  const latestRankByProfile = new Map<string, { belt_rank_id: string; promoted_at: string; full_name: string }>()
  for (const row of promotionsResult.data ?? []) {
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!rawProfile) continue
    const profile = rawProfile as { full_name: string }
    const key = row.profile_id as string
    if (!latestRankByProfile.has(key)) {
      latestRankByProfile.set(key, {
        belt_rank_id: row.belt_rank_id as string,
        promoted_at: row.promoted_at as string,
        full_name: profile.full_name ?? 'Unbekannt',
      })
    }
  }

  const promotionsReady: PromotionReady[] = []
  for (const [profileId, latest] of latestRankByProfile) {
    const currentBelt = beltById.get(latest.belt_rank_id)
    if (!currentBelt) continue
    const nextBelt = beltByOrder.get(currentBelt.order + 1)
    if (!nextBelt) continue

    const { count: sessions } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)

    const monthsElapsed = Math.floor(
      (now.getTime() - new Date(latest.promoted_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    const sessionsOk = !nextBelt.min_sessions || (sessions ?? 0) >= nextBelt.min_sessions
    const monthsOk = !nextBelt.min_time_months || monthsElapsed >= nextBelt.min_time_months
    if (!sessionsOk || !monthsOk) continue

    promotionsReady.push({
      profileId,
      memberName: latest.full_name,
      currentBelt: currentBelt.name,
      currentBeltColor: currentBelt.color_hex,
      nextBelt: nextBelt.name,
      nextBeltColor: nextBelt.color_hex,
      sessions: sessions ?? 0,
      months: monthsElapsed,
    })
  }
  promotionsReady.sort((a, b) => b.months - a.months)
  const promotionsTop3 = promotionsReady.slice(0, 3)

  const leadsByStatus: LeadsByStatus = {
    new: [], contacted: [], converted: [], lost: [],
    totals: { new: 0, contacted: 0, converted: 0, lost: 0 },
  }
  for (const row of (allLeadsResult.data ?? []) as LeadCard[]) {
    const bucket = row.status
    if (!(bucket in leadsByStatus.totals)) continue
    leadsByStatus.totals[bucket] += 1
    if (leadsByStatus[bucket].length < 2) leadsByStatus[bucket].push(row)
  }

  return {
    ...base,
    activeMembers: membersResult.count ?? 0,
    newLeads: leadsResult.count ?? 0,
    promotionsReady: promotionsTop3,
    leadsByStatus,
  }
}
