import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getFeaturedPost, getPosts } from '@/app/actions/blog'
import { BlogHero } from '@/components/public/BlogHero'
import { BlogCategoryFilter } from '@/components/public/BlogCategoryFilter'
import { BlogPostCard } from '@/components/public/BlogPostCard'

export const metadata: Metadata = {
  title: 'BJJ Blog | AXIS JIU JITSU',
  description: 'Techniken, Regeln, Geschichte und mehr — alles, was du über Brazilian Jiu-Jitsu wissen musst.',
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { category } = await searchParams
  const activeCategory = category ?? 'Alle'

  const [featured, posts] = await Promise.all([
    getFeaturedPost(),
    getPosts(activeCategory),
  ])

  return (
    <>
      {featured && <BlogHero post={featured} />}
      <Suspense>
        <BlogCategoryFilter active={activeCategory} />
      </Suspense>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Artikel in dieser Kategorie.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
