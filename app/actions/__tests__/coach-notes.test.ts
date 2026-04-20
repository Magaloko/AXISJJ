import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { addCoachNote, deleteCoachNote, updateCoachNote } from '../coach-notes'

const MEMBER_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const NOTE_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('addCoachNote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('rejects empty content', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await addCoachNote({ profile_id: MEMBER_UUID, content: '' })
    expect(result.error).toBeTruthy()
  })

  it('rejects when not staff', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await addCoachNote({ profile_id: MEMBER_UUID, content: 'Solid progress' })
    expect(result.error).toBe('Keine Berechtigung.')
  })

  it('inserts note when coach authenticated', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: NOTE_UUID }, error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(insertChain)

    const result = await addCoachNote({ profile_id: MEMBER_UUID, content: 'Good guard work' })
    expect(result.success).toBe(true)
    expect(result.id).toBe(NOTE_UUID)
  })
})

describe('updateCoachNote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('rejects when not staff', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await updateCoachNote({ id: NOTE_UUID, content: 'Updated' })
    expect(result.error).toBe('Keine Berechtigung.')
  })
})

describe('deleteCoachNote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('rejects when not staff', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValue(callerChain)
    const result = await deleteCoachNote(NOTE_UUID)
    expect(result.error).toBe('Keine Berechtigung.')
  })

  it('deletes successfully', async () => {
    const callerChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    }
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from
      .mockReturnValueOnce(callerChain)
      .mockReturnValueOnce(deleteChain)

    const result = await deleteCoachNote(NOTE_UUID)
    expect(result.success).toBe(true)
  })
})
