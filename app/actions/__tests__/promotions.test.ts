import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notify: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => p }))

import { promoteToNextBelt } from '../promotions'

function callerRoleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('promoteToNextBelt', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'owner-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when caller is not owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('coach'))
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when member has no current rank', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when no next belt exists', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { belt_rank_id: 'rank-top', belt_ranks: { order: 10 } }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const nextBeltChain = {
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(nextBeltChain)
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('inserts new profile_rank and returns success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { belt_rank_id: 'rank-white', belt_ranks: { order: 0 } }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const nextBeltChain = {
      select: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'rank-blue', name: 'Blau' }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(nextBeltChain)
    const insertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const memberChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Max' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(memberChain)

    const result = await promoteToNextBelt('profile-1')
    expect(result.success).toBe(true)
    expect(result.newBeltName).toBe('Blau')
    expect(insertChain.insert).toHaveBeenCalled()
  })
})
