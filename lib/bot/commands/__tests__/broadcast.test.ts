import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { broadcastCommand } from '../broadcast'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

const ownerCtx: BotContext = {
  chatId: 7, telegramUserId: 1, telegramUsername: null, firstName: null,
  botUser: { chat_id: 7, profile_id: 'p-o', bot_role: 'admin', telegram_username: null, first_name: null, linked_at: '' },
  profile: { id: 'p-o', full_name: 'O', email: 'o@ex.com', role: 'owner', phone: null, created_at: '' },
  role: 'admin',
}

describe('broadcastCommand', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejects empty text', async () => {
    await broadcastCommand.handler(ownerCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 7, type: 'private' }, date: 0, text: '/broadcast' },
    })
    expect(sendMessage).toHaveBeenCalledWith(7, expect.stringContaining('Nutzung'))
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('fans out to linked members only', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ chat_id: 100 }, { chat_id: 101 }],
        error: null,
      }),
    })
    const promise = broadcastCommand.handler(ownerCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 7, type: 'private' }, date: 0, text: '/broadcast Heute 18:00 ausgefallen!' },
    })
    // Drain the tiny setTimeout throttle used between sends.
    await vi.runAllTimersAsync()
    await promise

    const calls = vi.mocked(sendMessage).mock.calls
    // Two per-member sends + one summary to owner.
    expect(calls.length).toBe(3)
    expect(calls[0][0]).toBe(100)
    expect(calls[0][1]).toContain('Heute 18:00 ausgefallen!')
    expect(calls[1][0]).toBe(101)
    expect(calls[2][0]).toBe(7)
    expect(calls[2][1]).toContain('2 Mitglied')
  })
})
