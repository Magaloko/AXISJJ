import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase server client
const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom, auth: { getUser: vi.fn() } }

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { bookClass, cancelBooking } from '../bookings'

describe('bookClass', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })
})

describe('cancelBooking', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await cancelBooking('booking-1')
    expect(result.error).toBeDefined()
  })
})
