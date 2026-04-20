import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStorage = {
  from: vi.fn(),
}
const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
  storage: mockStorage,
}
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))

import { uploadClassTypeImage } from '../class-type-image'

function ownerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
  }
}

describe('uploadClassTypeImage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns error for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    })
    const fd = new FormData()
    fd.append('file', new File(['x'], 'test.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns error when no file provided', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fd = new FormData()
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns error for non-image file', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fd = new FormData()
    fd.append('file', new File(['x'], 'doc.pdf', { type: 'application/pdf' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBe('Nur Bilder erlaubt.')
  })

  it('returns error on storage upload failure', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: { message: 'storage error' } }),
      getPublicUrl: vi.fn(),
    }
    mockStorage.from.mockReturnValue(bucket)
    const fd = new FormData()
    fd.append('file', new File(['x'], 'img.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns public URL on success', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/img.jpg' } }),
    }
    mockStorage.from.mockReturnValue(bucket)
    const fd = new FormData()
    fd.append('file', new File(['x'], 'img.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.url).toBe('https://cdn.example.com/img.jpg')
    expect(result.error).toBeUndefined()
  })
})
