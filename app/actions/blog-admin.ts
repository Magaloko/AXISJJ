'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BlogPostInput {
  title: string
  slug: string
  excerpt: string
  body: string
  category: string
  tags: string[]
  cover_image_url?: string
  reading_time_min: number
  featured?: boolean
  published?: boolean
}

async function assertOwner(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return { userId: user.id }
}

export async function getAllPosts() {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error, data: null }
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('id,slug,title,category,published,published_at,featured,created_at')
    .order('created_at', { ascending: false })
  if (error) return { error: error.message, data: null }
  return { data, error: undefined }
}

export async function createPost(input: BlogPostInput): Promise<{ success?: boolean; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  const supabase = await createClient()

  if (input.featured) {
    await (supabase as any).from('blog_posts').update({ featured: false }).eq('featured', true)
  }

  const { error } = await (supabase as any).from('blog_posts').insert({
    ...input,
    cover_image_url: input.cover_image_url || null,
    published_at: input.published ? new Date().toISOString() : null,
  })
  if (error) return { error: error.message }
  revalidatePath('/blog')
  return { success: true }
}

export async function updatePost(id: string, input: Partial<BlogPostInput>): Promise<{ success?: boolean; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  const supabase = await createClient()

  if (input.featured) {
    await (supabase as any).from('blog_posts').update({ featured: false }).eq('featured', true)
  }

  const { error } = await (supabase as any).from('blog_posts').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  return { success: true }
}

export async function togglePublished(id: string): Promise<{ success?: boolean; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  const supabase = await createClient()

  const { data: post } = await (supabase as any).from('blog_posts').select('published,published_at').eq('id', id).single()
  if (!post) return { error: 'Post nicht gefunden.' }

  const nowPublished = !post.published
  const { error } = await (supabase as any).from('blog_posts').update({
    published: nowPublished,
    published_at: nowPublished && !post.published_at ? new Date().toISOString() : post.published_at,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/blog')
  return { success: true }
}

export async function deletePost(id: string): Promise<{ success?: boolean; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  const supabase = await createClient()
  const { error } = await (supabase as any).from('blog_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  return { success: true }
}

export async function getPostById(id: string) {
  const check = await assertOwner()
  if ('error' in check) return null
  const supabase = await createClient()
  const { data } = await (supabase as any).from('blog_posts').select('*').eq('id', id).single()
  return data
}
