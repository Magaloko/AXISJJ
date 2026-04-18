import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { linkCommand } from '../link'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

const unlinkedCtx: BotContext = {
  chatId: 100, telegramUserId: 200, telegramUsername: 'testuser', firstName: 'Test',
  botUser: null, profile: null, role: 'unlinked',
}

describe('linkCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('rejects valid code that has been used', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { code: 'ABC234', profile_id: 'p-1', expires_at: '2099-01-01', used_at: '2026-01-01' },
        error: null,
      }),
    })
    await linkCommand.handler(unlinkedCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 100, type: 'private' }, date: 0, text: '/link ABC234', from: { id: 200, is_bot: false, first_name: 'T' } },
    })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('bereits verwendet'))
  })

  it('prompts for phone when /link has no args', async () => {
    await linkCommand.handler(unlinkedCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 100, type: 'private' }, date: 0, text: '/link', from: { id: 200, is_bot: false, first_name: 'T' } },
    })
    expect(sendMessage).toHaveBeenCalled()
    const call = vi.mocked(sendMessage).mock.calls[0]
    expect(call[2]?.reply_markup).toMatchObject({ keyboard: expect.any(Array) })
  })

  it('rejects when already linked', async () => {
    const linkedCtx: BotContext = { ...unlinkedCtx, role: 'member' }
    await linkCommand.handler(linkedCtx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 100, type: 'private' }, date: 0, text: '/link', from: { id: 200, is_bot: false, first_name: 'T' } },
    })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('bereits'))
  })
})
