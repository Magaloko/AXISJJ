// app/actions/__tests__/profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

const mockVerifyAuth = { signInWithPassword: vi.fn() }
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: mockVerifyAuth }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockCookieStore = { get: vi.fn(), set: vi.fn() }
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { updateProfile, updateLanguage, changePassword } from '../profile'

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

  it('sets cookie even for anon visitors and does not touch DB', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateLanguage('en')
    expect(result.success).toBe(true)
    expect(mockCookieStore.set).toHaveBeenCalledWith('lang', 'en', expect.objectContaining({ path: '/' }))
    expect(mockSupabase.from).not.toHaveBeenCalled()
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

  it('accepts ru as a valid language', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateLanguage('ru')
    expect(result.success).toBe(true)
    expect(chain.update).toHaveBeenCalledWith({ language: 'ru' })
  })
})

describe('changePassword', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.c' } },
      error: null,
    })
  })

  const validInput = {
    current_password: 'currentPW123',
    new_password: 'brandNewPW456',
    confirm_password: 'brandNewPW456',
  }

  it('rejects when current and new passwords do not confirm', async () => {
    const result = await changePassword({ ...validInput, confirm_password: 'different' })
    expect(result.error).toBeTruthy()
  })

  it('rejects when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await changePassword(validInput)
    expect(result.error).toBeTruthy()
  })

  it('rejects when current password is wrong', async () => {
    mockVerifyAuth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    })
    const result = await changePassword(validInput)
    expect(result.error).toBeTruthy()
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('updates password when current password verifies', async () => {
    mockVerifyAuth.signInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })
    mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null })
    const result = await changePassword(validInput)
    expect(result.success).toBe(true)
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'brandNewPW456' })
  })

  it('propagates Supabase updateUser error message', async () => {
    mockVerifyAuth.signInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: null,
      error: { message: 'Password should be at least 6 characters' },
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await changePassword(validInput)
    expect(result.error).toContain('Password should be at least')
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
