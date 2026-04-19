import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Metadata } from 'next'
import { getAllSlugs, getPostBySlug } from '@/lib/blog'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Artikel nicht gefunden' }
  return {
    title: `${post.title} | AXIS Jiu-Jitsu Vienna`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('de-AT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

const TYPE_LABELS: Record<string, string> = {
  erklaerungsartikel: 'Erklärt',
  informationsartikel: 'Info',
  anleitung: 'Anleitung',
  artikel: 'Artikel',
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Breadcrumb */}
      <Link
        href="/blog"
        className="mb-8 inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
      >
        ← Zurück zum Blog
      </Link>

      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="border border-primary/30 bg-primary/5 px-2 py-0.5 font-bold uppercase tracking-wider text-primary">
          {TYPE_LABELS[post.type] ?? 'Artikel'}
        </span>
        <span className="text-muted-foreground">{formatDate(post.date)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="capitalize text-muted-foreground">Für {post.audience}</span>
      </div>

      <h1 className="mb-6 text-3xl font-black leading-tight text-foreground sm:text-5xl">
        {post.title}
      </h1>

      {/* Content */}
      <div className="prose-axis">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {/* CTA */}
      <div className="mt-16 border border-border bg-card p-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
          Bereit es selbst auszuprobieren?
        </p>
        <p className="mb-6 text-lg font-black text-foreground">
          Komm zum kostenlosen Probetraining
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/trial"
            className="inline-block bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            Probetraining buchen
          </Link>
          <Link
            href="/anmelden"
            className="inline-block border border-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Jetzt Mitglied werden
          </Link>
        </div>
      </div>
    </article>
  )
}
