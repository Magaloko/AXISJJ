// app/actions/__tests__/skills.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateSkillStatus } from '../skills'

describe('updateSkillStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateSkillStatus('skill-1', 'in_progress')
    expect(result.error).toBeDefined()
  })

  it('returns success on valid upsert', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateSkillStatus('skill-1', 'mastered')
    expect(result.success).toBe(true)
    expect(chain.upsert).toHaveBeenCalledWith(
      { profile_id: 'user-1', skill_id: 'skill-1', status: 'mastered' },
      { onConflict: 'profile_id,skill_id' }
    )
  })

  it('returns error when upsert fails', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ error: new Error('db error') }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateSkillStatus('skill-1', 'mastered')
    expect(result.error).toBeDefined()
  })
})
