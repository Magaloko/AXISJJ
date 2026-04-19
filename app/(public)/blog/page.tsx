import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog | AXIS Jiu-Jitsu Vienna',
  description: 'Artikel rund um Brazilian Jiu-Jitsu, Training, Technik und Gym-Kultur von AXIS Jiu-Jitsu Vienna.',
}

const TYPE_LABELS: Record<string, string> = {
  erklaerungsartikel: 'Erklärt',
  informationsartikel: 'Info',
  anleitung: 'Anleitung',
  artikel: 'Artikel',
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

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
        Blog · Wissen & Geschichten
      </p>
      <h1 className="mb-3 text-4xl font-black text-foreground sm:text-5xl">
        AXIS JOURNAL
      </h1>
      <p className="mb-12 max-w-2xl text-sm text-muted-foreground">
        Alles rund um Brazilian Jiu-Jitsu: Einsteiger-Guides, Trainingstipps, Technik-Erklärungen und
        Einblicke in das Leben auf der Matte bei AXIS Jiu-Jitsu Vienna.
      </p>

      <div className="grid gap-8">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block border border-border bg-card p-6 transition-colors hover:border-primary sm:p-8"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="border border-primary/30 bg-primary/5 px-2 py-0.5 font-bold uppercase tracking-wider text-primary">
                {TYPE_LABELS[post.type] ?? 'Artikel'}
              </span>
              <span className="text-muted-foreground">{formatDate(post.date)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground capitalize">Für {post.audience}</span>
            </div>
            <h2 className="mb-3 text-xl font-black leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">
              Weiterlesen →
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-16 border border-border bg-card p-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
          Bereit es selbst zu erleben?
        </p>
        <p className="mb-6 text-lg font-black text-foreground">
          1 Woche kostenlos testen
        </p>
        <Link
          href="/trial"
          className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          Probetraining buchen →
        </Link>
      </div>
    </div>
  )
}
