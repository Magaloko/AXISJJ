import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn() }
vi.mock('@/lib/supabase/service', () => ({ createServiceRoleClient: () => mockSupabase }))
vi.mock('../../telegram-api', () => ({ sendMessage: vi.fn() }))

import { unlinkCommand } from '../unlink'
import { sendMessage } from '../../telegram-api'
import type { BotContext } from '../../types'

const ctx: BotContext = {
  chatId: 100, telegramUserId: 200, telegramUsername: 'u', firstName: 'T',
  botUser: null, profile: null, role: 'member',
}

describe('unlinkCommand', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('deletes and confirms', async () => {
    mockSupabase.from.mockReturnValueOnce({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    await unlinkCommand.handler(ctx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('entfernt'))
  })

  it('reports failure on error', async () => {
    mockSupabase.from.mockReturnValueOnce({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }),
    })
    await unlinkCommand.handler(ctx, { update_id: 1 })
    expect(sendMessage).toHaveBeenCalledWith(100, expect.stringContaining('fehlgeschlagen'))
  })

  it('is restricted to linked roles', () => {
    expect(unlinkCommand.allowedRoles).toEqual(['admin', 'moderator', 'coach', 'member'])
  })
})
