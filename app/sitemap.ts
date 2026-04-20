import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/blog'

const SITE_URL = 'https://axisjj.vercel.app'

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',           priority: 1.0, changeFrequency: 'weekly' },
  { path: '/preise',    priority: 0.9, changeFrequency: 'monthly' },
  { path: '/trial',     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/anmelden',  priority: 0.9, changeFrequency: 'monthly' },
  { path: '/blog',      priority: 0.8, changeFrequency: 'weekly' },
  { path: '/kontakt',   priority: 0.7, changeFrequency: 'monthly' },
  { path: '/impressum', priority: 0.3, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const slugs = await getAllSlugs()
    blogEntries = slugs.map(slug => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    // ignore — blog might not be available at build time
  }

  return [...staticEntries, ...blogEntries]
}
