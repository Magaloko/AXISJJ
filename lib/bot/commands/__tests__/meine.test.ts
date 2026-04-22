import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
}))

import { meineCommand, cancelCommand } from '../meine'
import { sendMessage, answerCallbackQuery } from '../../telegram-api'
import type { BotContext } from '../../types'

const memberCtx: BotContext = {
  chatId: 42, telegramUserId: 7, telegramUsername: null, firstName: null,
  botUser: { chat_id: 42, profile_id: 'p-me', bot_role: 'member', telegram_username: null, first_name: null, linked_at: '' },
  profile: { id: 'p-me', full_name: 'Me', email: 'me@ex.com', role: 'member', phone: null, created_at: '' },
  role: 'member',
}

describe('meineCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('shows bookings with cancel buttons', async () => {
    const futureIso = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'b-1', status: 'confirmed',
            class_sessions: { id: 's-1', starts_at: futureIso, cancelled: false, class_types: { name: 'Fundamentals' } },
          },
        ],
        error: null,
      }),
    })
    await meineCommand.handler(memberCtx, { update_id: 1 })
    const opts = vi.mocked(sendMessage).mock.calls[0][2]
    const kb = (opts?.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard
    expect(kb[0][0].callback_data).toBe('/cancel b-1')
  })

  it('shows empty state when nothing booked', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    await meineCommand.handler(memberCtx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('Keine offenen Buchungen'))
  })
})

describe('cancelCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('refuses to cancel a booking that is not the caller\'s', async () => {
    // ownership lookup returns null
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    await cancelCommand.handler(memberCtx, {
      update_id: 1,
      callback_query: { id: 'c1', from: { id: 7, is_bot: false, first_name: 'M' }, data: '/cancel abcdef012345' },
    })
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('nicht deine'))
    expect(answerCallbackQuery).toHaveBeenCalledWith('c1', 'Nicht gefunden')
  })

  it('cancels own booking and triggers waitlist promotion', async () => {
    // 1st .from: ownership lookup returns the booking
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'b-1', session_id: 's-1' }, error: null,
      }),
    })
    // 2nd .from: update chain — last .eq resolves to { error: null }
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
    })
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

    await cancelCommand.handler(memberCtx, {
      update_id: 1,
      callback_query: { id: 'c1', from: { id: 7, is_bot: false, first_name: 'M' }, data: '/cancel b-1abcdef' },
    })
    expect(answerCallbackQuery).toHaveBeenCalledWith('c1', 'Storniert')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('promote_waitlist', { p_session_id: 's-1' })
  })
})
