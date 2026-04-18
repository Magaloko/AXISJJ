import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { upsertClassType, deleteClassType } from '../class-types'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('upsertClassType', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await upsertClassType({ name: 'X', level: 'all', gi: true })).error).toBeTruthy()
  })

  it('upserts on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upsert = { upsert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upsert)
    const res = await upsertClassType({ id: 'c-1', name: 'BJJ', level: 'all', gi: true, description: 'desc' })
    expect(res.success).toBe(true)
    expect(upsert.upsert).toHaveBeenCalled()
  })
})

describe('deleteClassType', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await deleteClassType('c-1')).error).toBeTruthy()
  })

  it('rejects deletion when sessions exist', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(countChain)
    expect((await deleteClassType('c-1')).error).toBeTruthy()
  })

  it('deletes when no sessions exist', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(countChain)
    const delChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(delChain)
    const res = await deleteClassType('c-1')
    expect(res.success).toBe(true)
  })
})
