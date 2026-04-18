import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { helpCommand } from '../help'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

function makeCtx(role: BotContext['role']): BotContext {
  return { chatId: 100, telegramUserId: 200, telegramUsername: null, firstName: 'T', botUser: null, profile: null, role }
}

describe('helpCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('shows /link for unlinked users', async () => {
    await helpCommand.handler(makeCtx('unlinked'), { update_id: 1 })
    const text = vi.mocked(sendMessage).mock.calls[0][1]
    expect(text).toContain('/link')
    expect(text).not.toContain('/me')
  })

  it('shows /me and /unlink for linked members', async () => {
    await helpCommand.handler(makeCtx('member'), { update_id: 1 })
    const text = vi.mocked(sendMessage).mock.calls[0][1]
    expect(text).toContain('/me')
    expect(text).toContain('/unlink')
    expect(text).not.toContain('/link ')
  })
})
