import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../telegram-api', () => ({ sendMessage: vi.fn() }))

import { sendTelegramToMember } from '../member-notify'
import { sendMessage } from '../telegram-api'

describe('sendTelegramToMember', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('noops when profile has no linked bot user', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    const result = await sendTelegramToMember('p-1', 'hi')
    expect(result.sent).toBe(false)
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('sends to the linked chat_id', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { chat_id: 5551234 }, error: null }),
    })
    const result = await sendTelegramToMember('p-1', 'hi', { parseMode: 'MarkdownV2' })
    expect(result.sent).toBe(true)
    expect(sendMessage).toHaveBeenCalledWith(5551234, 'hi', { parse_mode: 'MarkdownV2' })
  })

  it('returns not-sent without throwing on DB error', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    })
    const result = await sendTelegramToMember('p-1', 'hi')
    expect(result.sent).toBe(false)
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
