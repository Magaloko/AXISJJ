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

export interface OwnerInsights {
  utilizationTrend: UtilizationWeek[]
  topClasses: TopClass[]
  estimatedMonthlyRevenue: number
  activeMembers: number
  revenueBreakdown: { category: string; members: number; revenue: number }[]
  error?: string
}

export async function getOwnerInsights(): Promise<OwnerInsights> {
  const empty: OwnerInsights = {
    utilizationTrend: [], topClasses: [],
    estimatedMonthlyRevenue: 0, activeMembers: 0, revenueBreakdown: [],
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

  // ── Revenue estimate ──
  const activeMembers = membersResult.count ?? 0
  const avgPlanPrice = PRICING_PLANS.reduce((sum, plan) => {
    const tier = plan.tiers.find(t => t.durationMonths === 12) ?? plan.tiers[0]
    return sum + (tier?.pricePerMonth ?? 0)
  }, 0) / (PRICING_PLANS.length || 1)

  const estimatedMonthlyRevenue = Math.round(activeMembers * avgPlanPrice)

  const revenueBreakdown = PRICING_PLANS.map(plan => {
    const tier = plan.tiers.find(t => t.durationMonths === 12) ?? plan.tiers[0]
    const estMembers = Math.round(activeMembers / PRICING_PLANS.length)
    return {
      category: plan.category,
      members: estMembers,
      revenue: Math.round(estMembers * (tier?.pricePerMonth ?? 0)),
    }
  })

  return {
    utilizationTrend,
    topClasses,
    estimatedMonthlyRevenue,
    activeMembers,
    revenueBreakdown,
  }
}
