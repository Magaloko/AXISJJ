import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateMember, updateMemberRole } from '../members'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('updateMember', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateMember('p-1', { full_name: 'X' })).error).toBeTruthy()
  })

  it('updates fields', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateMember('p-1', { full_name: 'Thomas B.', phone: '+43 660', date_of_birth: '1990-01-01' })
    expect(res.success).toBe(true)
    expect(upd.update).toHaveBeenCalledWith({
      full_name: 'Thomas B.', phone: '+43 660', date_of_birth: '1990-01-01',
    })
  })
})

describe('updateMemberRole', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateMemberRole('p-1', 'coach')).error).toBeTruthy()
  })

  it('rejects self role change', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    expect((await updateMemberRole('owner-1', 'member')).error).toBeTruthy()
  })

  it('rejects role=owner from UI', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    expect((await updateMemberRole('p-1', 'owner' as any)).error).toBeTruthy()
  })

  it('updates role on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateMemberRole('p-1', 'coach')
    expect(res.success).toBe(true)
    expect(upd.update).toHaveBeenCalledWith({ role: 'coach' })
  })
})
