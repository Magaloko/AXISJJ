'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BlogPostInput } from '@/app/actions/blog-admin'

const CATEGORIES = [
  'Techniques', 'Rules & Scoring', 'History', 'Belt System',
  'Competition', 'Mindset', 'Nutrition', 'No-Gi', 'Kids BJJ',
]

interface Props {
  initial?: Partial<BlogPostInput> & { id?: string }
  onSave: (input: BlogPostInput) => Promise<{ success?: boolean; error?: string }>
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function BlogPostForm({ initial, onSave }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0])
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? '')
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [readingTime, setReadingTime] = useState(initial?.reading_time_min ?? 5)
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [published, setPublished] = useState(initial?.published ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    const result = await onSave({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image_url: coverUrl.trim() || undefined,
      reading_time_min: readingTime,
      featured,
      published,
    })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.push('/admin/blog')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <input value={title} onChange={e => { setTitle(e.target.value); if (!initial?.slug) setSlug(slugify(e.target.value)) }}
            className="w-full border border-border bg-input px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full border border-border bg-input px-3 py-2 font-mono text-sm" required />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full border border-border bg-input px-3 py-2 text-sm">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Reading Time (min)</label>
          <input type="number" min={1} value={readingTime} onChange={e => setReadingTime(Number(e.target.value))}
            className="w-full border border-border bg-input px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Excerpt (max 200 chars)</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} maxLength={200} rows={2}
          className="w-full resize-none border border-border bg-input px-3 py-2 text-sm" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Body (Markdown)</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={18}
          className="w-full resize-y border border-border bg-input px-3 py-2 font-mono text-sm" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Cover Image URL (optional)</label>
        <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)}
          className="w-full border border-border bg-input px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="guard passing, beginner, competition"
          className="w-full border border-border bg-input px-3 py-2 text-sm" />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
          Featured (hero slot)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
          Published
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Post'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-border px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted">
          Cancel
        </button>
      </div>
    </form>
  )
}
