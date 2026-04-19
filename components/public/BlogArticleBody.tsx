import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { BlogPost } from '@/app/actions/blog'

export function BlogArticleBody({ post }: { post: BlogPost }) {
  return (
    <article>
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.title} className="mb-8 w-full object-cover" style={{ maxHeight: 360 }} />
      )}
      <div className="[&_h2]:mt-8 [&_h2]:border-l-[3px] [&_h2]:border-primary [&_h2]:pl-3 [&_h2]:text-sm [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-widest [&_p]:mt-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground [&_blockquote]:mt-6 [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary [&_blockquote]:bg-muted [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic [&_blockquote]:text-sm [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-sm [&_li]:mt-1 [&_a]:text-primary [&_a]:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
      </div>
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="bg-foreground px-3 py-1 text-[9px] font-black uppercase tracking-widest text-background">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
