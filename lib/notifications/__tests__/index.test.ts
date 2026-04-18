import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sendEmailMock, sendTelegramMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  sendTelegramMock: vi.fn(),
}))

vi.mock('../email', () => ({ sendEmail: sendEmailMock }))
vi.mock('../telegram', () => ({ sendTelegram: sendTelegramMock }))

import { notify } from '../index'
import type { NotificationEvent } from '../events'

const event: NotificationEvent = {
  type: 'lead.created',
  data: { full_name: 'A', email: 'a@b.com', source: 'website' },
}

describe('notify', () => {
  beforeEach(() => {
    sendEmailMock.mockReset()
    sendTelegramMock.mockReset()
    sendEmailMock.mockResolvedValue(undefined)
    sendTelegramMock.mockResolvedValue(undefined)
  })

  it('calls both adapters with the formatted notification', async () => {
    await notify(event)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendTelegramMock).toHaveBeenCalledTimes(1)
    const emailArg = sendEmailMock.mock.calls[0][0]
    const tgArg = sendTelegramMock.mock.calls[0][0]
    expect(emailArg).toBe(tgArg)
    expect(emailArg.emailSubject).toContain('[AXIS]')
    expect(typeof emailArg.telegramMarkdown).toBe('string')
  })

  it('does not throw when one adapter rejects', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('smtp down'))
    await expect(notify(event)).resolves.toBeUndefined()
    expect(sendTelegramMock).toHaveBeenCalled()
  })
})
