import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))

import { getOwnerInsights } from '../owner-insights'

describe('getOwnerInsights', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getOwnerInsights()
    expect(result.error).toBeTruthy()
    expect(result.utilizationTrend).toEqual([])
  })

  it('returns error when caller is not owner', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await getOwnerInsights()
    expect(result.error).toBe('Keine Berechtigung.')
  })

  it('returns zero-filled insights when no data', async () => {
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    }
    const sessionsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const attendancesChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const membersCountChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }
    const subsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const lastMonthSubsChain = {
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const leadsChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const memberListChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const recentAttChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return profileChain
      if (callCount === 2) return sessionsChain
      if (callCount === 3) return attendancesChain
      if (callCount === 4) return membersCountChain
      if (callCount === 5) return subsChain
      if (callCount === 6) return lastMonthSubsChain
      if (callCount === 7) return leadsChain
      if (callCount === 8) return memberListChain
      if (callCount === 9) return recentAttChain
      return memberListChain
    })

    const result = await getOwnerInsights()
    expect(result.utilizationTrend).toHaveLength(8)  // always 8 weeks
    expect(result.topClasses).toEqual([])
    expect(result.inactiveMembers).toEqual([])
    expect(result.activeMembers).toBe(0)
  })
})

describe('getOwnerInsights — new metrics', () => {
  function makeOwnerChain() {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    }
  }

  function makeEmptyChain() {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
  }

  function makeCountChain(count: number) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count, error: null }),
    }
  }

  function makeSubsChain(subs: { category: string; price_per_month: number }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
    }
  }

  function makeLastMonthSubsChain(subs: { price_per_month: number }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: subs, error: null }),
    }
  }

  function makeLeadsChain(leads: { status: string; created_at: string }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: leads, error: null }),
    }
  }

  function makeSessionsChain(sessions: { capacity: number; bookings: { status: string }[] }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: sessions, error: null }),
    }
  }

  it('computes leadConversionRate as 0 when no leads this month', async () => {
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.leadConversionRate).toBe(0)
  })

  it('computes leadConversionRate correctly', async () => {
    const now = new Date()
    const thisMonth = now.toISOString()
    const leads = [
      { status: 'converted', created_at: thisMonth },
      { status: 'converted', created_at: thisMonth },
      { status: 'new', created_at: thisMonth },
      { status: 'lost', created_at: thisMonth },
    ]
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain(leads)
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.leadConversionRate).toBe(50) // 2/4 × 100
  })

  it('computes revenueVsLastMonthPct as 0 when last month had no revenue', async () => {
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([{ category: 'adults', price_per_month: 100 }])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.revenueVsLastMonthPct).toBe(0)
  })

  it('computes revenueVsLastMonthPct correctly with non-zero delta', async () => {
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      // Current month: 2 subs × 100 = 200
      if (call === 5) return makeSubsChain([
        { category: 'adults', price_per_month: 100 },
        { category: 'adults', price_per_month: 100 },
      ])
      // Last month: 1 sub × 100 = 100 → delta = (200-100)/100 × 100 = 100%
      if (call === 6) return makeLastMonthSubsChain([{ price_per_month: 100 }])
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.revenueVsLastMonthPct).toBe(100)
  })

  it('computes avgClassFillRate from session data', async () => {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const sessions = [
      { starts_at: recentDate, capacity: 10, bookings: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'cancelled' }] },
      { starts_at: recentDate, capacity: 10, bookings: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'confirmed' }, { status: 'confirmed' }] },
    ]
    // session 1: 2/10 = 20%, session 2: 4/10 = 40%, avg = 30%
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain(sessions)
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.avgClassFillRate).toBe(30)
  })
})
