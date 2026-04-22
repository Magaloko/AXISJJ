import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
}))

import { buchenCommand, bookCommand } from '../buchen'
import { sendMessage, answerCallbackQuery } from '../../telegram-api'
import type { BotContext } from '../../types'

const memberCtx: BotContext = {
  chatId: 42,
  telegramUserId: 7,
  telegramUsername: null,
  firstName: null,
  botUser: {
    chat_id: 42, profile_id: 'p-me', bot_role: 'member',
    telegram_username: null, first_name: null, linked_at: '',
  },
  profile: {
    id: 'p-me', full_name: 'Me', email: 'me@ex.com',
    role: 'member', phone: null, created_at: '',
  },
  role: 'member',
}

describe('buchenCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('tells unlinked callers to link first', async () => {
    await buchenCommand.handler({ ...memberCtx, profile: null }, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('/link'))
  })

  it('filters out sessions the caller has already booked', async () => {
    const futureIso = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 's-open',
            starts_at: futureIso,
            capacity: 12,
            class_types: { name: 'Fundamentals', gi: true },
            bookings: [],
          },
          {
            id: 's-mine',
            starts_at: futureIso,
            capacity: 12,
            class_types: { name: 'Advanced', gi: false },
            bookings: [{ id: 'b1', profile_id: 'p-me', status: 'confirmed' }],
          },
        ],
        error: null,
      }),
    })
    await buchenCommand.handler(memberCtx, { update_id: 1 })
    const opts = vi.mocked(sendMessage).mock.calls[0][2]
    const kb = (opts?.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard
    const allData = kb.flat().map((b) => b.callback_data)
    expect(allData).toEqual(['/book s-open'])
  })

  it('shows empty state when nothing bookable', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    await buchenCommand.handler(memberCtx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(
      42,
      expect.stringContaining('Keine offenen Klassen'),
    )
  })
})

describe('bookCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('books confirmed and acks the callback query', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { status: 'confirmed' },
      error: null,
    })
    await bookCommand.handler(memberCtx, {
      update_id: 1,
      callback_query: { id: 'cbq-1', from: { id: 7, is_bot: false, first_name: 'M' }, data: '/book abcdef12' },
    })
    expect(mockSupabase.rpc).toHaveBeenCalledWith('book_class', {
      p_session_id: 'abcdef12',
      p_user_id: 'p-me',
    })
    expect(answerCallbackQuery).toHaveBeenCalledWith('cbq-1', 'Gebucht')
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('Gebucht'))
  })

  it('communicates waitlist status', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { status: 'waitlisted' },
      error: null,
    })
    await bookCommand.handler(memberCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 42, type: 'private' }, date: 0, text: '/book abc12345' },
    })
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('Warteliste'))
  })

  it('rejects call without session id', async () => {
    await bookCommand.handler(memberCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 42, type: 'private' }, date: 0, text: '/book' },
    })
    expect(sendMessage).toHaveBeenCalledWith(42, expect.stringContaining('Nutzung'))
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
