import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockNeq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}))

function chain(overrides: Record<string, unknown> = {}) {
  const base = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    neq: mockNeq,
    single: mockSingle,
  }
  Object.assign(base, overrides)
  mockFrom.mockReturnValue(base)
  mockSelect.mockReturnValue(base)
  mockEq.mockReturnValue(base)
  mockOrder.mockReturnValue(base)
  mockLimit.mockReturnValue(base)
  mockNeq.mockReturnValue(base)
  return base
}

describe('blog actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getPosts returns published posts ordered by published_at desc', async () => {
    const base = chain()
    mockOrder.mockResolvedValue({ data: [{ id: '1', title: 'Test' }], error: null })
    const { getPosts } = await import('@/app/actions/blog')
    const result = await getPosts()
    expect(mockFrom).toHaveBeenCalledWith('blog_posts')
    expect(mockEq).toHaveBeenCalledWith('published', true)
    expect(result).toEqual([{ id: '1', title: 'Test' }])
  })

  it('getPost returns null when not found', async () => {
    chain()
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const { getPost } = await import('@/app/actions/blog')
    const result = await getPost('missing-slug')
    expect(result).toBeNull()
  })

  it('getFeaturedPost returns the featured published post', async () => {
    chain()
    mockSingle.mockResolvedValue({ data: { id: '2', featured: true }, error: null })
    const { getFeaturedPost } = await import('@/app/actions/blog')
    const result = await getFeaturedPost()
    expect(mockEq).toHaveBeenCalledWith('featured', true)
    expect(result).toEqual({ id: '2', featured: true })
  })

  it('getRelatedPosts returns posts from same category excluding current slug', async () => {
    chain()
    mockLimit.mockResolvedValue({ data: [{ id: '3' }], error: null })
    const { getRelatedPosts } = await import('@/app/actions/blog')
    const result = await getRelatedPosts('Techniques', 'guard-passing')
    expect(mockEq).toHaveBeenCalledWith('category', 'Techniques')
    expect(mockNeq).toHaveBeenCalledWith('slug', 'guard-passing')
    expect(result).toEqual([{ id: '3' }])
  })
})
