import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPost, getRelatedPosts } from '@/app/actions/blog'
import { BlogArticleBody } from '@/components/public/BlogArticleBody'
import { BlogSidebar } from '@/components/public/BlogSidebar'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: `${post.title} | AXIS JIU JITSU Blog`,
    description: post.excerpt,
    openGraph: post.cover_image_url ? { images: [post.cover_image_url] } : undefined,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.category, post.slug)

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted px-4 py-2 text-[10px] text-muted-foreground sm:px-6">
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        {' → '}
        <span>{post.category}</span>
        {' → '}
        <span className="text-foreground">{post.title}</span>
      </div>

      {/* Hero */}
      <div className="bg-primary px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
            {post.category}
            {publishedDate && ` · ${publishedDate}`}
            {` · ${post.reading_time_min} min read`}
          </p>
          <h1 className="mt-3 text-2xl font-black leading-tight text-primary-foreground sm:text-3xl">{post.title}</h1>
          <p className="mt-2 text-sm text-primary-foreground/80">{post.excerpt}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-1">
            <BlogArticleBody post={post} />
          </div>
          <div className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <BlogSidebar related={related} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
