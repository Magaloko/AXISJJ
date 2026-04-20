import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notify: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => p }))

import { upsertSession, cancelSession, createRecurringSessions } from '../sessions'

const authedUser = { data: { user: { id: 'coach-1' } }, error: null }

describe('cancelSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await cancelSession('session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when caller lacks role', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await cancelSession('session-1')
    expect(result.error).toBeTruthy()
  })

  it('returns success when cancel succeeds', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const infoChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { starts_at: '2026-04-18T18:00:00Z', class_types: { name: 'BJJ' } }, error: null }),
    }
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(infoChain)
      .mockReturnValueOnce(updateChain)
    const result = await cancelSession('session-1')
    expect(result.success).toBe(true)
  })

  it('returns error when DB update fails', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const infoChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { starts_at: '2026-04-18T18:00:00Z', class_types: { name: 'BJJ' } }, error: null }),
    }
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(infoChain)
      .mockReturnValueOnce(updateChain)
    const result = await cancelSession('session-1')
    expect(result.error).toBeTruthy()
  })
})

describe('upsertSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue(authedUser)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await upsertSession({
      class_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', starts_at: '2026-04-18T18:00:00Z',
      ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym',
    })
    expect(result.error).toBeTruthy()
  })

  it('returns error when caller lacks role', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await upsertSession({
      class_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', starts_at: '2026-04-18T18:00:00Z',
      ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym',
    })
    expect(result.error).toBeTruthy()
  })

  it('inserts new session and returns it', async () => {
    const newSession = { id: 's-new', class_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', starts_at: '2026-04-18T18:00:00Z', ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym', cancelled: false }
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const upsertChain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
    }
    const classTypeChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { name: 'BJJ' }, error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(upsertChain)
      .mockReturnValueOnce(classTypeChain)
    const result = await upsertSession({
      class_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', starts_at: '2026-04-18T18:00:00Z',
      ends_at: '2026-04-18T19:30:00Z', capacity: 16, location: 'AXIS Gym',
    })
    expect(result.success).toBe(true)
    expect(result.session?.id).toBe('s-new')
  })
})

describe('createRecurringSessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue(authedUser)
  })

  const validInput = {
    class_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    start_time: '18:00',
    end_time: '19:30',
    weekdays: [1, 3], // Mon, Wed
    capacity: 16,
    location: 'AXIS Gym',
  }

  it('rejects empty weekdays array', async () => {
    const result = await createRecurringSessions({ ...validInput, weekdays: [] })
    expect(result.error).toBeTruthy()
  })

  it('rejects end_date before start_date', async () => {
    const result = await createRecurringSessions({
      ...validInput,
      start_date: '2026-05-31',
      end_date: '2026-05-01',
    })
    expect(result.error).toBe('Enddatum muss nach Startdatum liegen.')
  })

  it('rejects end_time at or before start_time', async () => {
    const result = await createRecurringSessions({
      ...validInput,
      start_time: '19:30',
      end_time: '18:00',
    })
    expect(result.error).toBe('Endzeit muss nach Startzeit liegen.')
  })

  it('rejects when user is not staff', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await createRecurringSessions(validInput)
    expect(result.error).toBe('Keine Berechtigung.')
  })

  it('generates sessions for matching weekdays', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const insertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(insertChain)

    const result = await createRecurringSessions(validInput)
    expect(result.success).toBe(true)
    // May 2026: Mondays = 4, 11, 18, 25; Wednesdays = 6, 13, 20, 27 → 8 sessions
    expect(result.count).toBe(8)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ class_type_id: validInput.class_type_id }),
      ])
    )
  })

  it('refuses more than 200 sessions', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await createRecurringSessions({
      ...validInput,
      start_date: '2026-01-01',
      end_date: '2028-01-01',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    })
    expect(result.error).toContain('Zu viele')
  })
})
