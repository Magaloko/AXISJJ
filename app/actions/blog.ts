import { createClient } from '@/lib/supabase/server'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  tags: string[]
  cover_image_url: string | null
  reading_time_min: number
  featured: boolean
  published: boolean
  published_at: string | null
  created_at: string
}

export async function getPosts(category?: string): Promise<BlogPost[]> {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('blog_posts')
    .select('id,slug,title,excerpt,category,tags,cover_image_url,reading_time_min,featured,published_at,created_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (category && category !== 'Alle') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return (data ?? []) as BlogPost[]
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) return null
  return data as BlogPost
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('blog_posts')
    .select('id,slug,title,excerpt,category,tags,cover_image_url,reading_time_min,published_at')
    .eq('published', true)
    .eq('featured', true)
    .single()

  return (data as BlogPost) ?? null
}

export async function getRelatedPosts(category: string, excludeSlug: string): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('blog_posts')
    .select('id,slug,title,category,reading_time_min,published_at')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(3)

  return (data ?? []) as BlogPost[]
}
