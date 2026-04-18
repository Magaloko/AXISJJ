import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

import { getTodaySessions, getSessionBookings, getAdminDashboard } from '../admin'

describe('getTodaySessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getTodaySessions()
    expect(result.error).toBeTruthy()
  })

  it('returns sessions array on success', async () => {
    const sessions = [{ id: 's-1', starts_at: '2026-04-18T18:00:00Z', ends_at: '2026-04-18T19:30:00Z', cancelled: false, location: 'AXIS Gym', capacity: 16, class_types: { name: 'BJJ' }, bookings: [] }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: sessions, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await getTodaySessions()
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions![0].id).toBe('s-1')
  })
})

describe('getSessionBookings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getSessionBookings('session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns bookings with attendance status', async () => {
    const bookings = [{ id: 'b-1', profile_id: 'p-1', status: 'confirmed', profiles: { full_name: 'Anna K.' } }]
    const attendances = [{ profile_id: 'p-1', checked_in_at: '2026-04-18T18:05:00Z' }]
    const bookingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: bookings, error: null }),
    }
    const attendanceChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: attendances, error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(bookingChain)
      .mockReturnValueOnce(attendanceChain)

    const result = await getSessionBookings('session-1')
    expect(result.bookings).toHaveLength(1)
    expect(result.bookings![0].checkedInAt).toBe('2026-04-18T18:05:00Z')
  })
})

describe('getAdminDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getAdminDashboard()
    expect(result.error).toBeTruthy()
  })

  it('returns coach stats (checkinsToday, bookingsToday, todaySessions)', async () => {
    // profile role fetch
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    // attendances count
    const attendanceChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ count: 5, error: null }),
    }
    // bookings count
    const bookingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 8, error: null }),
    }
    // sessions
    const sessionChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(attendanceChain)
      .mockReturnValueOnce(bookingChain)
      .mockReturnValueOnce(sessionChain)

    const result = await getAdminDashboard()
    expect(result.checkinsToday).toBe(5)
    expect(result.bookingsToday).toBe(8)
    expect(result.todaySessions).toEqual([])
    expect(result.activeMembers).toBeUndefined()
  })
})

describe('getAdminDashboard — new owner fields', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns leadsByStatus and PromotionReady shape for owner', async () => {
    // Profile lookup returns owner
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    })
    // 3 Promise.all queries for coach base: attendances count, bookings count, sessions list
    const countPromise = (count: number) => ({ count, error: null, data: [] })
    const mkCountChain = (count: number) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue(countPromise(count)),
    })
    mockSupabase.from.mockReturnValueOnce(mkCountChain(0))
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    // 5 Promise.all queries for owner block
    // members count
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
    })
    // new leads count
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
    })
    // profile_ranks
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    // belt_ranks
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: 'w', name: 'Weiß', order: 0, color_hex: '#fff', min_sessions: null, min_time_months: null },
               { id: 'b', name: 'Blau', order: 1, color_hex: '#3b82f6', min_sessions: 100, min_time_months: 6 }],
        error: null,
      }),
    })
    // all leads
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 'l1', full_name: 'Max', source: 'instagram', status: 'new', created_at: '2026-04-18T00:00:00Z' },
          { id: 'l2', full_name: 'Sara', source: 'website', status: 'new', created_at: '2026-04-17T00:00:00Z' },
          { id: 'l3', full_name: 'Tim', source: 'instagram', status: 'contacted', created_at: '2026-04-16T00:00:00Z' },
          { id: 'l4', full_name: 'Anna', source: 'website', status: 'converted', created_at: '2026-04-15T00:00:00Z' },
        ],
        error: null,
      }),
    })

    const { getAdminDashboard } = await import('../admin')
    const result = await getAdminDashboard()

    expect(result.leadsByStatus).toBeDefined()
    expect(result.leadsByStatus?.new.length).toBe(2)
    expect(result.leadsByStatus?.contacted.length).toBe(1)
    expect(result.leadsByStatus?.converted.length).toBe(1)
    expect(result.leadsByStatus?.lost.length).toBe(0)
    expect(result.leadsByStatus?.totals.new).toBe(2)
    expect(result.promotionsReady).toEqual([])
  })
})
