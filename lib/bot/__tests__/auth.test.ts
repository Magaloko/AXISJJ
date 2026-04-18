import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceRoleClient: () => mockSupabase,
}))

import { resolveContext } from '../auth'

describe('resolveContext', () => {
  beforeEach(() => { vi.resetAllMocks() })

  function mockBotUserChain(data: unknown) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    }
  }

  it('returns unlinked when chat not in bot_users', async () => {
    mockSupabase.from.mockReturnValueOnce(mockBotUserChain(null))
    const ctx = await resolveContext(123, { id: 456, is_bot: false, first_name: 'Max' })
    expect(ctx.role).toBe('unlinked')
    expect(ctx.botUser).toBeNull()
  })

  it('returns role + profile when linked', async () => {
    mockSupabase.from.mockReturnValueOnce(mockBotUserChain({
      chat_id: 123, profile_id: 'p-1', bot_role: 'admin',
      telegram_username: 'magomed', first_name: 'M', linked_at: '2026-04-19T00:00:00Z',
    }))
    mockSupabase.from.mockReturnValueOnce(mockBotUserChain({
      id: 'p-1', full_name: 'Magomed', email: 'm@x.com', role: 'owner',
      phone: '+43660', created_at: '2026-01-01T00:00:00Z',
    }))
    const ctx = await resolveContext(123, { id: 456, is_bot: false, first_name: 'Mago' })
    expect(ctx.role).toBe('admin')
    expect(ctx.profile?.full_name).toBe('Magomed')
  })
})
