import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { generateBotLinkCode, unlinkBotAccount } from '../bot-link'

function authChain() {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'p-1' } }, error: null })
}

describe('generateBotLinkCode', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('rejects unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await generateBotLinkCode()
    expect(res.error).toBeTruthy()
  })

  it('rejects when profile already linked', async () => {
    authChain()
    // bot_users check → linked
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { chat_id: 123 }, error: null }),
    })
    const res = await generateBotLinkCode()
    expect(res.error).toBeTruthy()
    expect(res.error).toMatch(/bereits/i)
  })

  it('reuses existing active code if one exists', async () => {
    authChain()
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    // existing code lookup → returns one
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { code: 'ABC123', expires_at: '2099-01-01' }, error: null }),
    })
    const res = await generateBotLinkCode()
    expect(res.code).toBe('ABC123')
  })

  it('generates and inserts a new 6-char code', async () => {
    authChain()
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    // rate-limit count
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ count: 0, error: null }),
    })
    const insert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(insert)

    const res = await generateBotLinkCode()
    expect(res.code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/)
    expect(insert.insert).toHaveBeenCalled()
  })

  it('enforces rate limit (max 5 per hour)', async () => {
    authChain()
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ count: 6, error: null }),
    })
    const res = await generateBotLinkCode()
    expect(res.error).toMatch(/zu viele/i)
  })
})

describe('unlinkBotAccount', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('rejects unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await unlinkBotAccount()
    expect(res.error).toBeTruthy()
  })

  it('deletes bot_users row on success', async () => {
    authChain()
    const del = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(del)
    const res = await unlinkBotAccount()
    expect(res.success).toBe(true)
    expect(del.delete).toHaveBeenCalled()
  })
})
