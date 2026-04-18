// app/actions/__tests__/profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockCookieStore = { get: vi.fn(), set: vi.fn() }
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { updateProfile, updateLanguage } from '../profile'

describe('updateProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateProfile({ full_name: 'Max', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })

  it('returns error for name shorter than 2 chars', async () => {
    const result = await updateProfile({ full_name: 'A', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })

  it('returns success and coerces empty strings to null', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateProfile({ full_name: 'Max Mustermann', phone: '', date_of_birth: '' })
    expect(result.success).toBe(true)
    expect(chain.update).toHaveBeenCalledWith({
      full_name: 'Max Mustermann',
      phone: null,
      date_of_birth: null,
    })
  })

  it('returns error when DB update fails', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('db error') }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateProfile({ full_name: 'Max Mustermann', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })
})

describe('updateLanguage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockCookieStore.set.mockReset()
  })

  it('returns error for invalid lang value', async () => {
    const result = await updateLanguage('fr' as 'de' | 'en')
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateLanguage('en')
    expect(result.error).toBeDefined()
  })

  it('updates DB and sets lang cookie on success', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateLanguage('en')
    expect(result.success).toBe(true)
    expect(chain.update).toHaveBeenCalledWith({ language: 'en' })
    expect(mockCookieStore.set).toHaveBeenCalledWith('lang', 'en', expect.objectContaining({ path: '/' }))
  })
})
