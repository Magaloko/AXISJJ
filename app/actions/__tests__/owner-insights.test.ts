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
      if (callCount === 5) return memberListChain
      if (callCount === 6) return recentAttChain
      return memberListChain
    })

    const result = await getOwnerInsights()
    expect(result.utilizationTrend).toHaveLength(8)  // always 8 weeks
    expect(result.topClasses).toEqual([])
    expect(result.inactiveMembers).toEqual([])
    expect(result.activeMembers).toBe(0)
  })
})
