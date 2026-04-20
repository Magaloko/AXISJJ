'use server'

import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { PRICING_PLANS } from '@/lib/pricing'

export interface UtilizationWeek {
  week: string           // ISO date of Monday
  capacity: number       // total capacity of sessions that week
  confirmed: number      // confirmed bookings
  utilization: number    // percentage 0-100
}

export interface TopClass {
  name: string
  attendances: number
}

export interface InactiveMember {
  profileId: string
  fullName: string
  email: string
  daysSinceLastVisit: number | null  // null if never visited
}

export interface OwnerInsights {
  utilizationTrend: UtilizationWeek[]
  topClasses: TopClass[]
  estimatedMonthlyRevenue: number
  activeMembers: number
  revenueBreakdown: { category: string; members: number; revenue: number }[]
  inactiveMembers: InactiveMember[]
  leadConversionRate: number        // % leads converted this month
  revenueVsLastMonthPct: number     // % delta vs last month (positive = growth)
  avgClassFillRate: number          // % avg fill across last 30d sessions
  error?: string
}

export async function getOwnerInsights(): Promise<OwnerInsights> {
  const empty: OwnerInsights = {
    utilizationTrend: [], topClasses: [],
    estimatedMonthlyRevenue: 0, activeMembers: 0, revenueBreakdown: [],
    inactiveMembers: [],
    leadConversionRate: 0,
    revenueVsLastMonthPct: 0,
    avgClassFillRate: 0,
  }

  const auth = await assertOwner()
  if ('error' in auth) return { ...empty, error: auth.error }

  const supabase = await createClient()

  const now = new Date()
  const eightWeeksAgo = new Date(now)
  eightWeeksAgo.setDate(now.getDate() - 56)
  eightWeeksAgo.setHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [sessionsResult, attendancesResult, membersResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('id, starts_at, capacity, bookings(id, status)')
      .eq('cancelled', false)
      .gte('starts_at', eightWeeksAgo.toISOString())
      .lte('starts_at', now.toISOString()),
    supabase
      .from('attendances')
      .select('id, checked_in_at, class_sessions(class_types(name))')
      .gte('checked_in_at', thirtyDaysAgo.toISOString())
      .lte('checked_in_at', now.toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member'),
  ])

  // ── Utilization trend (8 weeks) ──
  const weekMap: Map<string, { capacity: number; confirmed: number }> = new Map()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow - i * 7)
    d.setHours(0, 0, 0, 0)
    weekMap.set(d.toISOString().split('T')[0], { capacity: 0, confirmed: 0 })
  }
  for (const s of sessionsResult.data ?? []) {
    if (!s.starts_at) continue
    const sessionDate = new Date(s.starts_at)
    const dow = (sessionDate.getDay() + 6) % 7
    sessionDate.setDate(sessionDate.getDate() - dow)
    sessionDate.setHours(0, 0, 0, 0)
    const key = sessionDate.toISOString().split('T')[0]
    const bucket = weekMap.get(key)
    if (!bucket) continue
    bucket.capacity += s.capacity
    const confirmedHere = (s.bookings ?? []).filter(b => b.status === 'confirmed').length
    bucket.confirmed += confirmedHere
  }
  const utilizationTrend: UtilizationWeek[] = Array.from(weekMap.entries()).map(([week, b]) => ({
    week,
    capacity: b.capacity,
    confirmed: b.confirmed,
    utilization: b.capacity > 0 ? Math.round((b.confirmed / b.capacity) * 100) : 0,
  }))

  // ── Top classes by attendance (30 days) ──
  const classMap = new Map<string, number>()
  for (const a of attendancesResult.data ?? []) {
    const session = Array.isArray(a.class_sessions) ? a.class_sessions[0] : a.class_sessions
    const classType = session?.class_types
    const ct = Array.isArray(classType) ? classType[0] : classType
    const name = ct?.name ?? 'Unbekannt'
    classMap.set(name, (classMap.get(name) ?? 0) + 1)
  }
  const topClasses: TopClass[] = Array.from(classMap.entries())
    .map(([name, attendances]) => ({ name, attendances }))
    .sort((a, b) => b.attendances - a.attendances)
    .slice(0, 5)

  // ── Real revenue from active subscriptions ──
  const activeMembers = membersResult.count ?? 0
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('category, price_per_month')
    .eq('status', 'active')

  let estimatedMonthlyRevenue = 0
  const revenueByCat: Record<string, { members: number; revenue: number }> = {
    students: { members: 0, revenue: 0 },
    adults:   { members: 0, revenue: 0 },
    kids:     { members: 0, revenue: 0 },
  }
  for (const s of activeSubs ?? []) {
    const price = Number(s.price_per_month)
    estimatedMonthlyRevenue += price
    if (revenueByCat[s.category]) {
      revenueByCat[s.category].members += 1
      revenueByCat[s.category].revenue += price
    }
  }
  estimatedMonthlyRevenue = Math.round(estimatedMonthlyRevenue)

  const revenueBreakdown = PRICING_PLANS.map(plan => ({
    category: plan.category,
    members: revenueByCat[plan.category]?.members ?? 0,
    revenue: Math.round(revenueByCat[plan.category]?.revenue ?? 0),
  }))

  // ── Last month date range ──
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1)

  const [lastMonthSubsResult, thisMonthLeadsResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('price_per_month')
      .lte('start_date', endOfLastMonth.toISOString().split('T')[0])
      .or(`end_date.is.null,end_date.gte.${startOfLastMonth.toISOString().split('T')[0]}`),
    supabase
      .from('leads')
      .select('status, created_at')
      .gte('created_at', startOfThisMonth.toISOString())
      .lte('created_at', now.toISOString()),
  ])

  // ── Lead conversion rate ──
  const thisMonthLeads = thisMonthLeadsResult.data ?? []
  const convertedCount = thisMonthLeads.filter(l => l.status === 'converted').length
  const leadConversionRate = thisMonthLeads.length > 0
    ? Math.round((convertedCount / thisMonthLeads.length) * 100)
    : 0

  // ── Revenue vs last month ──
  const lastMonthRevenue = (lastMonthSubsResult.data ?? [])
    .reduce((sum, s) => sum + Number(s.price_per_month), 0)
  const revenueVsLastMonthPct = lastMonthRevenue > 0
    ? Math.round(((estimatedMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0

  // ── Avg class fill rate (30d sessions, reuse sessionsResult) ──
  const thirtyDaySessions = (sessionsResult.data ?? []).filter(s => {
    if (!s.starts_at) return true
    return new Date(s.starts_at) >= thirtyDaysAgo
  })
  const fillRates = thirtyDaySessions
    .filter(s => s.capacity > 0)
    .map(s => {
      const confirmed = (s.bookings ?? []).filter(b => b.status === 'confirmed').length
      return confirmed / s.capacity
    })
  const avgClassFillRate = fillRates.length > 0
    ? Math.round((fillRates.reduce((a, b) => a + b, 0) / fillRates.length) * 100)
    : 0

  // ── Inactive members — no training in last 30 days ──
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()
  const [memberListResult, recentAttendancesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'member')
      .order('full_name', { ascending: true, nullsFirst: false }),
    supabase
      .from('attendances')
      .select('profile_id, checked_in_at')
      .gte('checked_in_at', thirtyDaysAgoIso)
      .order('checked_in_at', { ascending: false }),
  ])

  const activeMemberIds = new Set(
    (recentAttendancesResult.data ?? []).map(a => a.profile_id)
  )

  // For inactive members, fetch their ALL-TIME last attendance to show "X days ago"
  const inactiveIds = (memberListResult.data ?? [])
    .filter(m => !activeMemberIds.has(m.id))
    .map(m => m.id)

  const lastSeenMap = new Map<string, string>()
  if (inactiveIds.length > 0) {
    const { data: lastSeenData } = await supabase
      .from('attendances')
      .select('profile_id, checked_in_at')
      .in('profile_id', inactiveIds)
      .order('checked_in_at', { ascending: false })
    for (const a of lastSeenData ?? []) {
      if (!lastSeenMap.has(a.profile_id)) {
        lastSeenMap.set(a.profile_id, a.checked_in_at)
      }
    }
  }

  const nowMs = now.getTime()
  const inactiveMembers: InactiveMember[] = (memberListResult.data ?? [])
    .filter(m => !activeMemberIds.has(m.id))
    .map(m => {
      const lastIso = lastSeenMap.get(m.id) ?? null
      const daysSinceLastVisit = lastIso
        ? Math.floor((nowMs - new Date(lastIso).getTime()) / (1000 * 60 * 60 * 24))
        : null
      return {
        profileId: m.id,
        fullName: m.full_name ?? 'Unbekannt',
        email: m.email,
        daysSinceLastVisit,
      }
    })
    .sort((a, b) => {
      if (a.daysSinceLastVisit === null) return 1
      if (b.daysSinceLastVisit === null) return -1
      return a.daysSinceLastVisit - b.daysSinceLastVisit
    })
    .slice(0, 20)

  return {
    utilizationTrend,
    topClasses,
    estimatedMonthlyRevenue,
    activeMembers,
    revenueBreakdown,
    inactiveMembers,
    leadConversionRate,
    revenueVsLastMonthPct,
    avgClassFillRate,
  }
}
