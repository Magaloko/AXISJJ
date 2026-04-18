import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/bot/router', () => ({
  dispatch: vi.fn().mockResolvedValue(undefined),
  resetRegistry: vi.fn(),
}))
vi.mock('@/lib/bot/commands', () => ({
  registerAllCommands: vi.fn(),
}))

import { POST, GET } from '../route'
import { dispatch } from '@/lib/bot/router'

function makeRequest(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== undefined) headers['x-telegram-bot-api-secret-token'] = secret
  return new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('telegram webhook route', () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...origEnv, TELEGRAM_WEBHOOK_SECRET: 'super-secret' }
  })

  it('rejects request with missing secret header', async () => {
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(403)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('rejects request with wrong secret', async () => {
    const res = await POST(makeRequest({}, 'wrong') as never)
    expect(res.status).toBe(403)
  })

  it('rejects invalid JSON', async () => {
    const res = await POST(makeRequest('{not json', 'super-secret') as never)
    expect(res.status).toBe(400)
  })

  it('accepts valid update and dispatches', async () => {
    const update = { update_id: 1, message: { message_id: 1, chat: { id: 1, type: 'private' }, date: 0 } }
    const res = await POST(makeRequest(update, 'super-secret') as never)
    expect(res.status).toBe(200)
    expect(dispatch).toHaveBeenCalledWith(update)
  })

  it('GET returns 405', async () => {
    const res = await GET()
    expect(res.status).toBe(405)
  })
})
