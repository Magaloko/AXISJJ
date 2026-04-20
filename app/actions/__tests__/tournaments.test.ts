import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import {
  createTournament, updateTournament, approveTournament,
  cancelTournament, getTournamentsForAdmin,
} from '../tournaments'

function roleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

const validInput = {
  name: 'IBJJF European',
  date: '2026-06-01',
  location: 'Lisbon',
  type: 'external' as const,
}

describe('createTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await createTournament(validInput)
    expect(result.error).toBeTruthy()
  })

  it('coach creates with pending_approval status', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'tourn-1' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createTournament(validInput)
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'IBJJF European',
        status: 'pending_approval',
        coach_id: 'user-1',
      }),
    )
  })

  it('owner creates with approved status', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'tourn-1' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createTournament(validInput)
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' }),
    )
  })

  it('rejects invalid input', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const result = await createTournament({ ...validInput, name: '' })
    expect(result.error).toBeTruthy()
  })
})

describe('approveTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const result = await approveTournament('t-1')
    expect(result.error).toBeTruthy()
  })

  it('updates status to approved for owner', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await approveTournament('t-1')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'approved' })
  })
})

describe('cancelTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await cancelTournament('t-1')
    expect(result.error).toBeTruthy()
  })

  it('sets status to cancelled', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await cancelTournament('t-1')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'cancelled' })
  })
})

describe('getTournamentsForAdmin', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('returns empty for non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await getTournamentsForAdmin()
    expect(result).toEqual([])
  })

  it('returns tournaments for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const listChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 't-1', name: 'Test', date: '2026-06-01', end_date: null,
          location: 'Wien', type: 'internal', description: null,
          registration_deadline: null, coach_id: 'coach-1', status: 'approved',
          created_at: '2026-04-21',
        }],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(listChain)
    const result = await getTournamentsForAdmin()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test')
  })
})
