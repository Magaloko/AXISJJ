import Link from 'next/link'
import type { BlogPost } from '@/app/actions/blog'

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block border-t-[3px] border-primary bg-card transition-colors hover:bg-surface-muted">
      <div className="h-40 w-full bg-surface-muted">
        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{post.category}</p>
        <h3 className="mt-1 text-sm font-black leading-snug text-foreground group-hover:text-primary">{post.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{post.reading_time_min} min read</p>
      </div>
    </Link>
  )
}
