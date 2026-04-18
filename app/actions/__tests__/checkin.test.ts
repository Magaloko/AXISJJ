import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { checkIn } from '../checkin'

describe('checkIn', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await checkIn('profile-1', 'session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when profile not found', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await checkIn('unknown-uuid', 'session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns success with member name on valid check-in', async () => {
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Anna Kovács' }, error: null }),
    }
    const attendanceChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(attendanceChain)

    const result = await checkIn('profile-1', 'session-1')
    expect(result.success).toBe(true)
    expect(result.memberName).toBe('Anna Kovács')
  })

  it('returns error when upsert fails', async () => {
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Anna Kovács' }, error: null }),
    }
    const attendanceChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    }
    mockSupabase.from
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(attendanceChain)

    const result = await checkIn('profile-1', 'session-1')
    expect(result.error).toBeTruthy()
  })
})
