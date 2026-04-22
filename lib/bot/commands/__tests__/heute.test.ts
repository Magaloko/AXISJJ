import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { heuteCommand } from '../heute'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

const coachCtx: BotContext = {
  chatId: 99, telegramUserId: 1, telegramUsername: null, firstName: null,
  botUser: { chat_id: 99, profile_id: 'p-c', bot_role: 'coach', telegram_username: null, first_name: null, linked_at: '' },
  profile: { id: 'p-c', full_name: 'C', email: 'c@ex.com', role: 'coach', phone: null, created_at: '' },
  role: 'coach',
}

describe('heuteCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('lists todays sessions with counts', async () => {
    const today = new Date()
    today.setHours(18, 0, 0, 0)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 's', starts_at: today.toISOString(), capacity: 10,
          class_types: { name: 'Fundamentals' },
          bookings: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'waitlisted' }],
        }],
        error: null,
      }),
    })
    await heuteCommand.handler(coachCtx, { update_id: 1 })
    const text = vi.mocked(sendMessage).mock.calls[0][1]
    expect(text).toContain('Klassen heute')
    expect(text).toMatch(/\d{2}:\d{2} · Fundamentals · 2\/10/)
  })

  it('empty state', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    await heuteCommand.handler(coachCtx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(99, expect.stringContaining('keine Klassen'))
  })
})
