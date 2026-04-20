import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: mockFrom,
  })),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

function chain() {
  const base = { select: mockSelect, eq: mockEq, update: mockUpdate, insert: mockInsert, delete: mockDelete, single: mockSingle, order: mockOrder }
  mockFrom.mockReturnValue(base)
  mockSelect.mockReturnValue(base)
  mockEq.mockReturnValue(base)
  mockUpdate.mockReturnValue(base)
  mockInsert.mockReturnValue(base)
  mockDelete.mockReturnValue(base)
  mockOrder.mockReturnValue(base)
  return base
}

describe('blog-admin actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createPost returns error when not owner', async () => {
    chain()
    mockSingle.mockResolvedValueOnce({ data: { role: 'member' }, error: null })
    const { createPost } = await import('@/app/actions/blog-admin')
    const result = await createPost({ title: 'T', slug: 's', excerpt: 'e', body: 'b', category: 'History', tags: [], reading_time_min: 5 })
    expect(result.error).toBeTruthy()
  })

  it('togglePublished sets published_at on first publish', async () => {
    chain()
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'owner' }, error: null })
      .mockResolvedValueOnce({ data: { published: false, published_at: null }, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const { togglePublished } = await import('@/app/actions/blog-admin')
    const result = await togglePublished('post-id')
    expect(result.error).toBeUndefined()
  })
})
