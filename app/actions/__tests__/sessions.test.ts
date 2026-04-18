import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { upsertSession, cancelSession } from '../sessions'

const authedUser = { data: { user: { id: 'coach-1' } }, error: null }

describe('cancelSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await cancelSession('session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns success when cancel succeeds', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await cancelSession('session-1')
    expect(result.success).toBe(true)
  })

  it('returns error when DB update fails', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await cancelSession('session-1')
    expect(result.error).toBeTruthy()
  })
})

describe('upsertSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await upsertSession({
      class_type_id: 'ct-1', starts_at: '2026-04-18T18:00:00Z',
      ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym',
    })
    expect(result.error).toBeTruthy()
  })

  it('inserts new session and returns it', async () => {
    const newSession = { id: 's-new', class_type_id: 'ct-1', starts_at: '2026-04-18T18:00:00Z', ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym', cancelled: false }
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await upsertSession({
      class_type_id: 'ct-1', starts_at: '2026-04-18T18:00:00Z',
      ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym',
    })
    expect(result.success).toBe(true)
    expect(result.session?.id).toBe('s-new')
  })
})
