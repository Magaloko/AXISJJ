import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))
vi.mock('../link', () => ({ linkCommand: { handler: vi.fn() } }))

import { startCommand } from '../start'
import { sendMessage } from '../../telegram-api'
import { linkCommand } from '../link'
import type { BotContext } from '../../types'

const ctx: BotContext = {
  chatId: 100, telegramUserId: 200, telegramUsername: null, firstName: 'T',
  botUser: null, profile: null, role: 'unlinked',
}

describe('startCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('sends welcome on plain /start', async () => {
    await startCommand.handler(ctx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 100, type: 'private' }, date: 0, text: '/start', from: { id: 200, is_bot: false, first_name: 'T' } },
    })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('Willkommen'))
  })

  it('dispatches to linkCommand on /start link_XXXXXX deep-link', async () => {
    await startCommand.handler(ctx, {
      update_id: 1,
      message: { message_id: 1, chat: { id: 100, type: 'private' }, date: 0, text: '/start link_ABC234', from: { id: 200, is_bot: false, first_name: 'T' } },
    })
    expect(linkCommand.handler).toHaveBeenCalled()
    const call = vi.mocked(linkCommand.handler).mock.calls[0]
    expect(call[1].message?.text).toBe('/link ABC234')
  })
})
