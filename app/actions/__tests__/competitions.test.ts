import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { upsertCompetition, deleteCompetition, getMyCompetitions } from '../competitions'

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

describe('upsertCompetition', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('rejects empty name', async () => {
    const result = await upsertCompetition({ name: '', date: '2026-04-01' })
    expect(result.error).toBeTruthy()
  })

  it('rejects invalid date', async () => {
    const result = await upsertCompetition({ name: 'Austrian Open', date: 'invalid' })
    expect(result.error).toBeTruthy()
  })

  it('rejects when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await upsertCompetition({ name: 'Austrian Open', date: '2026-04-01' })
    expect(result.error).toBe('Nicht eingeloggt.')
  })

  it('creates competition on valid input', async () => {
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'c-1' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await upsertCompetition({
      name: 'Austrian Open',
      date: '2026-04-01',
      location: 'Wien',
      category: 'Gi Blue',
      placement: '1st',
    })
    expect(result.success).toBe(true)
    expect(result.id).toBe('c-1')
  })

  it('updates existing competition when id provided', async () => {
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: VALID_UUID }, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await upsertCompetition({
      id: VALID_UUID,
      name: 'Updated Name',
      date: '2026-04-01',
    })
    expect(result.success).toBe(true)
  })

  it('returns error when supabase upsert fails', async () => {
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await upsertCompetition({ name: 'Valid Event', date: '2026-04-01' })
    expect(result.error).toContain('DB Error')
  })
})

describe('deleteCompetition', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('rejects when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await deleteCompetition(VALID_UUID)
    expect(result.error).toBe('Nicht eingeloggt.')
  })

  it('deletes successfully', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await deleteCompetition(VALID_UUID)
    expect(result.success).toBe(true)
  })
})

describe('getMyCompetitions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns empty array when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await getMyCompetitions()
    expect(result).toEqual([])
  })

  it('returns competitions for current user', async () => {
    const rows = [
      { id: 'c-1', profile_id: 'user-1', name: 'Event 1', date: '2026-03-01', location: 'Wien', category: null, placement: '1st', notes: null, created_at: '2026-03-01T00:00:00Z' },
      { id: 'c-2', profile_id: 'user-1', name: 'Event 2', date: '2026-02-01', location: null, category: null, placement: null, notes: null, created_at: '2026-02-01T00:00:00Z' },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await getMyCompetitions()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Event 1')
  })
})
