import Link from 'next/link'
import type { BlogPost } from '@/app/actions/blog'

export function BlogHero({ post }: { post: BlogPost }) {
  return (
    <div className="bg-primary px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
          Featured · {post.category} · {post.reading_time_min} min read
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-primary-foreground sm:text-4xl">{post.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-6 inline-block bg-primary-foreground px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary transition-opacity hover:opacity-90"
        >
          Read Article →
        </Link>
      </div>
    </div>
  )
}
