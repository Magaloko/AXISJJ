import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import {
  registerForTournament,
  updateRegistrationStatus,
  getRegistrationsForTournament,
} from '../tournament-registrations'

function roleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('registerForTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'member-1' } }, error: null })
  })

  it('rejects when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await registerForTournament('t-1', {
      weight_category: '-70kg', gi_nogi: 'gi', notes: null,
    })
    expect(result.error).toBeTruthy()
  })

  it('upserts registration with pending status', async () => {
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await registerForTournament('t-1', {
      weight_category: '-70kg', gi_nogi: 'gi', notes: 'excited',
    })
    expect(result.success).toBe(true)
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      {
        tournament_id: 't-1',
        profile_id: 'member-1',
        weight_category: '-70kg',
        gi_nogi: 'gi',
        notes: 'excited',
        status: 'pending',
      },
      { onConflict: 'tournament_id,profile_id' },
    )
  })
})

describe('updateRegistrationStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await updateRegistrationStatus('r-1', 'approved')
    expect(result.error).toBeTruthy()
  })

  it('updates status for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await updateRegistrationStatus('r-1', 'approved')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'approved' })
  })
})

describe('getRegistrationsForTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('returns empty for non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await getRegistrationsForTournament('t-1')
    expect(result).toEqual([])
  })

  it('returns registrations with member names for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const listChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'r-1', profile_id: 'm-1', weight_category: '-70kg',
          gi_nogi: 'gi', notes: null, status: 'pending',
          profiles: { full_name: 'Max' },
        }],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(listChain)
    const result = await getRegistrationsForTournament('t-1')
    expect(result).toHaveLength(1)
    expect(result[0].memberName).toBe('Max')
  })
})
