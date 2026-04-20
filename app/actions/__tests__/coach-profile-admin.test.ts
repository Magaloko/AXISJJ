import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { getCoachProfile, upsertCoachProfile } from '../coach-profile-admin'

function ownerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
  }
}

function nonOwnerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
  }
}

describe('getCoachProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns null for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(nonOwnerChain())
    const result = await getCoachProfile('profile-1')
    expect(result).toBeNull()
  })

  it('returns null when no profile row exists', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    mockSupabase.from.mockReturnValueOnce(fetchChain)
    const result = await getCoachProfile('profile-1')
    expect(result).toBeNull()
  })

  it('returns mapped profile data', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          profile_id: 'profile-1',
          specialization: 'Head Coach',
          bio: 'Bio text',
          achievements: 'Champion',
          show_on_website: true,
          display_order: 1,
        },
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(fetchChain)
    const result = await getCoachProfile('profile-1')
    expect(result).toEqual({
      profileId: 'profile-1',
      specialization: 'Head Coach',
      bio: 'Bio text',
      achievements: 'Champion',
      showOnWebsite: true,
      displayOrder: 1,
    })
  })
})

describe('upsertCoachProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns error for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(nonOwnerChain())
    const result = await upsertCoachProfile('profile-1', { showOnWebsite: true })
    expect(result.error).toBeTruthy()
  })

  it('returns error on db failure', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await upsertCoachProfile('profile-1', {})
    expect(result.error).toBeTruthy()
  })

  it('returns success and calls upsert with correct payload', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await upsertCoachProfile('profile-1', {
      specialization: 'Head Coach',
      bio: 'Bio',
      achievements: 'Champion',
      showOnWebsite: true,
      displayOrder: 1,
    })
    expect(result.success).toBe(true)
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      {
        profile_id: 'profile-1',
        specialization: 'Head Coach',
        bio: 'Bio',
        achievements: 'Champion',
        show_on_website: true,
        display_order: 1,
      },
      { onConflict: 'profile_id' }
    )
  })
})
