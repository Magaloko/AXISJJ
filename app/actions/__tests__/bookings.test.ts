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
  rpc: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notify: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => p }))

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
    mockSupabase.rpc.mockResolvedValue({ data: { error: 'Klasse nicht gefunden.' }, error: null })
    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })

  it('returns error when already booked (non-cancelled)', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { error: 'Du hast diese Klasse bereits gebucht.' }, error: null })
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

  it('promotes first waitlisted booking via atomic RPC after cancel', async () => {
    const cancelChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'b-1', session_id: 'sess-1' }], error: null }),
    }
    const sessionInfoChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { starts_at: '2026-04-18T18:00:00Z', class_types: { name: 'BJJ' } }, error: null }),
    }
    const memberProfileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Max' }, error: null }),
    }
    const promotedProfileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Anna', email: 'anna@example.com' }, error: null }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return cancelChain
      if (callCount === 2) return sessionInfoChain
      if (callCount === 3) return memberProfileChain
      return promotedProfileChain
    })
    mockSupabase.rpc.mockResolvedValue({ data: 'promoted-user-id', error: null })

    const result = await cancelBooking('b-1')
    expect(result.success).toBe(true)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('promote_waitlist', { p_session_id: 'sess-1' })
  })
})
