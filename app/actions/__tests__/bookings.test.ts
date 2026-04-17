// app/actions/__tests__/bookings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

type ChainMock = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

function makeChain(finalResult: unknown): ChainMock {
  const chain: ChainMock = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
  // All methods return the chain for chaining, except the terminal one returns the result
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.single.mockResolvedValue(finalResult)
  chain.insert.mockResolvedValue(finalResult)
  chain.update.mockReturnValue(chain)
  return chain
}

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { bookClass, cancelBooking } from '../bookings'

describe('bookClass', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })

  it('returns error when auth getUser returns error', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('network') })
    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })

  it('returns error when session does not exist', async () => {
    // existing booking check: no existing booking
    const existingChain = makeChain({ data: null, error: null })
    // count query returns 0
    const countChain = makeChain({ count: 0, error: null })
    countChain.select.mockReturnValue(countChain)
    countChain.eq.mockReturnValue(countChain)
    // session query returns null (session not found)
    const sessionChain = makeChain({ data: null, error: null })

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return existingChain // existing booking check
      if (callCount === 2) return countChain    // confirmed count
      return sessionChain                        // session lookup
    })

    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })

  it('returns error when already booked (non-cancelled)', async () => {
    const chain = makeChain({ data: { id: 'b-1', status: 'confirmed' }, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })
})

describe('cancelBooking', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await cancelBooking('booking-1')
    expect(result.error).toBeDefined()
  })

  it('returns error when booking not found (no-op update)', async () => {
    const chain = makeChain({ data: [], error: null })
    chain.select.mockResolvedValue({ data: [], error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await cancelBooking('booking-1')
    expect(result.error).toBeDefined()
  })

  it('returns success when booking cancelled', async () => {
    const chain = makeChain({ data: [{ id: 'b-1' }], error: null })
    chain.select.mockResolvedValue({ data: [{ id: 'b-1' }], error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await cancelBooking('booking-1')
    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
  })
})
