import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../auth', () => ({
  resolveContext: vi.fn(),
}))

vi.mock('../telegram-api', () => ({
  sendMessage: vi.fn(),
}))

import { registerCommand, dispatch, resetRegistry } from '../router'
import { resolveContext } from '../auth'
import { sendMessage } from '../telegram-api'

describe('router', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetRegistry()
  })

  it('extracts command name and dispatches', async () => {
    const handler = vi.fn()
    registerCommand({ name: 'start', allowedRoles: [], handler })
    vi.mocked(resolveContext).mockResolvedValue({
      chatId: 1, telegramUserId: 1, telegramUsername: null, firstName: null,
      botUser: null, profile: null, role: 'unlinked',
    })
    await dispatch({
      update_id: 1,
      message: { message_id: 1, chat: { id: 1, type: 'private' }, date: 0, text: '/start', from: { id: 1, is_bot: false, first_name: 'X' } },
    })
    expect(handler).toHaveBeenCalled()
  })

  it('rejects command when role not in allowedRoles', async () => {
    const handler = vi.fn()
    registerCommand({ name: 'admin_only', allowedRoles: ['admin'], handler })
    vi.mocked(resolveContext).mockResolvedValue({
      chatId: 1, telegramUserId: 1, telegramUsername: null, firstName: null,
      botUser: null, profile: null, role: 'member',
    })
    await dispatch({
      update_id: 1,
      message: { message_id: 1, chat: { id: 1, type: 'private' }, date: 0, text: '/admin_only', from: { id: 1, is_bot: false, first_name: 'X' } },
    })
    expect(handler).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(1, expect.stringContaining('keinen Zugriff'))
  })

  it('strips @botname suffix', async () => {
    const handler = vi.fn()
    registerCommand({ name: 'help', allowedRoles: [], handler })
    vi.mocked(resolveContext).mockResolvedValue({
      chatId: 1, telegramUserId: 1, telegramUsername: null, firstName: null,
      botUser: null, profile: null, role: 'unlinked',
    })
    await dispatch({
      update_id: 1,
      message: { message_id: 1, chat: { id: 1, type: 'private' }, date: 0, text: '/help@AXISJJ_Bot', from: { id: 1, is_bot: false, first_name: 'X' } },
    })
    expect(handler).toHaveBeenCalled()
  })

  it('routes contact messages to link command', async () => {
    const linkHandler = vi.fn()
    registerCommand({ name: 'link', allowedRoles: [], handler: linkHandler })
    vi.mocked(resolveContext).mockResolvedValue({
      chatId: 1, telegramUserId: 1, telegramUsername: null, firstName: null,
      botUser: null, profile: null, role: 'unlinked',
    })
    await dispatch({
      update_id: 1,
      message: {
        message_id: 1, chat: { id: 1, type: 'private' }, date: 0,
        from: { id: 1, is_bot: false, first_name: 'X' },
        contact: { phone_number: '+43660', first_name: 'X', user_id: 1 },
      },
    })
    expect(linkHandler).toHaveBeenCalled()
  })
})
