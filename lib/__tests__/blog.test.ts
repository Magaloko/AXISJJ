import { describe, it, expect } from 'vitest'
import { getAllPosts, getPostBySlug, getAllSlugs } from '../blog'

describe('blog library', () => {
  it('returns at least one post', async () => {
    const posts = await getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
  })

  it('sorts posts by date descending', async () => {
    const posts = await getAllPosts()
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true)
    }
  })

  it('each post has required metadata', async () => {
    const posts = await getAllPosts()
    for (const p of posts) {
      expect(p.slug).toBeTruthy()
      expect(p.title).toBeTruthy()
      expect(p.date).toBeTruthy()
    }
  })

  it('returns all slugs', async () => {
    const slugs = await getAllSlugs()
    expect(slugs.length).toBeGreaterThan(0)
    expect(slugs).toContain('was-ist-bjj')
  })

  it('returns null for unknown slug', async () => {
    const post = await getPostBySlug('this-does-not-exist')
    expect(post).toBeNull()
  })

  it('returns post content for known slug', async () => {
    const post = await getPostBySlug('was-ist-bjj')
    expect(post).not.toBeNull()
    expect(post!.title.length).toBeGreaterThan(5)
    expect(post!.content.length).toBeGreaterThan(100)
  })
})
