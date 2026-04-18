import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateLeadStatus, createLead } from '../leads'

function callerRoleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('updateLeadStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('rejects unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await updateLeadStatus('l-1', 'contacted')).error).toBeTruthy()
  })

  it('rejects member role', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('member'))
    expect((await updateLeadStatus('l-1', 'contacted')).error).toBeTruthy()
  })

  it('rejects invalid status', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    expect((await updateLeadStatus('l-1', 'bogus' as any)).error).toBeTruthy()
  })

  it('updates status on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await updateLeadStatus('l-1', 'converted')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'converted' })
  })
})

describe('createLead', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('requires auth', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await createLead({ full_name: 'X', email: 'x@x.com', source: 'website' })).error).toBeTruthy()
  })

  it('requires coach/owner role', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('member'))
    expect((await createLead({ full_name: 'X', email: 'x@x.com', source: 'website' })).error).toBeTruthy()
  })

  it('inserts the lead', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('coach'))
    const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createLead({ full_name: 'Max', email: 'max@x.com', source: 'instagram' })
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalled()
  })
})
