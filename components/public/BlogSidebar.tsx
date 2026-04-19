import Link from 'next/link'
import type { BlogPost } from '@/app/actions/blog'

export function BlogSidebar({ related }: { related: BlogPost[] }) {
  return (
    <aside className="space-y-8">
      {related.length > 0 && (
        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary">Related Posts</p>
          <div className="space-y-4">
            {related.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">{post.category}</p>
                <p className="mt-1 text-xs font-bold leading-snug text-foreground group-hover:text-primary">{post.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{post.reading_time_min} min read</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="bg-primary p-5 text-center text-primary-foreground">
        <p className="text-[10px] font-black uppercase tracking-widest">Train With Us</p>
        <p className="mt-2 text-xs opacity-80">Try your first week free at AXIS JJJ</p>
        <Link
          href="/trial"
          className="mt-4 inline-block bg-primary-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary"
        >
          1 Woche Gratis
        </Link>
      </div>
    </aside>
  )
}
