import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { meCommand } from '../me'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

const fullCtx: BotContext = {
  chatId: 100,
  telegramUserId: 200,
  telegramUsername: 'tester',
  firstName: 'T',
  botUser: {
    chat_id: 100,
    profile_id: 'p-1',
    bot_role: 'member',
    telegram_username: 'tester',
    first_name: 'T',
    linked_at: '2026-01-15T10:00:00Z',
  },
  profile: {
    id: 'p-1',
    full_name: 'Max Mustermann',
    email: 'max@example.com',
    role: 'member',
    phone: '+43123456',
    created_at: '2025-06-01T00:00:00Z',
  },
  role: 'member',
}

describe('meCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('sends profile info with belt lookup', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { belt_ranks: { name: 'Blue', stripes: 2 } },
        error: null,
      }),
    })
    await meCommand.handler(fullCtx, { update_id: 1 })
    const text = vi.mocked(sendMessage).mock.calls[0][1]
    expect(text).toContain('Max Mustermann')
    expect(text).toContain('max@example.com')
    expect(text).toContain('Blue')
    expect(text).toContain('@tester')
  })

  it('errors when profile missing', async () => {
    const ctx: BotContext = { ...fullCtx, profile: null }
    await meCommand.handler(ctx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('Fehler'))
  })
})
