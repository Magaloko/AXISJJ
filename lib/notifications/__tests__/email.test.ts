import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn()
  const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }))
  return { sendMailMock, createTransportMock }
})

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}))

import { sendEmail } from '../email'
import type { FormattedNotification } from '../events'

const payload: FormattedNotification = {
  emailSubject: '[AXIS] Test',
  emailText: 'text body',
  emailHtml: '<div>html</div>',
  telegramMarkdown: 'tg',
}

describe('sendEmail', () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    sendMailMock.mockReset()
    sendMailMock.mockResolvedValue({ messageId: 'abc' })
    createTransportMock.mockClear()
    createTransportMock.mockImplementation(() => ({ sendMail: sendMailMock }))
  })

  afterEach(() => {
    process.env = { ...origEnv }
  })

  it('is a no-op when env vars are missing', async () => {
    delete process.env.GMAIL_USER
    delete process.env.GMAIL_APP_PASSWORD
    delete process.env.NOTIFICATION_RECIPIENT
    await sendEmail(payload)
    expect(createTransportMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('calls createTransport with Gmail SMTP config and sendMail with payload', async () => {
    process.env.GMAIL_USER = 'user@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'pw'
    process.env.NOTIFICATION_RECIPIENT = 'owner@example.com'
    await sendEmail(payload)
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'user@gmail.com', pass: 'pw' },
    })
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'user@gmail.com',
      to: 'owner@example.com',
      subject: payload.emailSubject,
      text: payload.emailText,
      html: payload.emailHtml,
    })
  })

  it('catches and logs sendMail errors without propagating', async () => {
    process.env.GMAIL_USER = 'user@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'pw'
    process.env.NOTIFICATION_RECIPIENT = 'owner@example.com'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    sendMailMock.mockRejectedValueOnce(new Error('boom'))
    await expect(sendEmail(payload)).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
