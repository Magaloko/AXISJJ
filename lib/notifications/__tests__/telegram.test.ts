import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendTelegram } from '../telegram'
import type { FormattedNotification } from '../events'

const payload: FormattedNotification = {
  emailSubject: 'S',
  emailText: 'T',
  emailHtml: 'H',
  telegramMarkdown: '🆕 *Hi*',
}

describe('sendTelegram', () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    process.env = { ...origEnv }
    vi.unstubAllGlobals()
  })

  it('is a no-op when env vars are missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await sendTelegram(payload)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls Telegram Bot API with MarkdownV2 payload', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'TOKEN'
    process.env.TELEGRAM_CHAT_ID = '12345'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)
    await sendTelegram(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/botTOKEN/sendMessage')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    const body = JSON.parse(init.body)
    expect(body).toEqual({
      chat_id: '12345',
      text: payload.telegramMarkdown,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    })
  })

  it('logs on non-OK HTTP response without throwing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'T'
    process.env.TELEGRAM_CHAT_ID = '1'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' })
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendTelegram(payload)).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('catches fetch throw without propagating', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'T'
    process.env.TELEGRAM_CHAT_ID = '1'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn().mockRejectedValue(new Error('net'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendTelegram(payload)).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
