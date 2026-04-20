#!/usr/bin/env tsx
/**
 * Migrates German blog markdown files from content/blog/*.md into the
 * Supabase blog_posts table. Run once to seed the database; safe to re-run
 * (truncates blog_posts first).
 *
 * Required env vars (via .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   - service role, bypasses RLS (NEVER commit)
 *
 * Usage:
 *   npx tsx scripts/migrate-md-to-supabase.ts
 *   npx tsx scripts/migrate-md-to-supabase.ts --dry-run
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })
config()

const DRY = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

const CATEGORY_MAP: Record<string, string> = {
  erklaerungsartikel: 'Grundlagen',
  informationsartikel: 'Wissen',
  'seo-artikel': 'Wissen',
  erfahrungsbericht: 'Erfahrungen',
  'trainer-portrait': 'Team',
}

function firstParagraph(markdown: string): string {
  for (const raw of markdown.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    if (t.startsWith('#')) continue
    if (t.startsWith('---')) continue
    if (t.startsWith('>')) continue
    return t
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 280)
  }
  return ''
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function deriveTags(slug: string, zielgruppe: string, typ: string): string[] {
  const tags = new Set<string>()
  for (const z of zielgruppe.split(/[,;]/).map(s => s.trim()).filter(Boolean)) {
    tags.add(z)
  }
  if (/kinder/.test(slug)) tags.add('kinder')
  if (/frauen/.test(slug)) tags.add('frauen')
  if (/wien/.test(slug)) tags.add('wien')
  if (/einsteiger|anfaenger|erstes/.test(slug)) tags.add('einsteiger')
  if (/gurt|weissgurt|blaugurt/.test(slug)) tags.add('guertel')
  if (/preis|mitglied/.test(slug)) tags.add('preise')
  if (/coach|trainer/.test(slug)) tags.add('team')
  tags.add(typ.replace(/-artikel$/, '').replace(/-/g, ' '))
  return Array.from(tags).slice(0, 5)
}

async function main() {
  const files = (await fs.readdir(BLOG_DIR)).filter(f => f.endsWith('.md'))
  console.log(`Found ${files.length} markdown files in ${BLOG_DIR}`)

  const rows = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.md$/, '')
      const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      const titel = String(data.titel ?? slug)
      const datum = String(data.datum ?? new Date().toISOString().slice(0, 10))
      const typ = String(data.typ ?? 'informationsartikel')
      const zielgruppe = String(data.zielgruppe ?? 'alle')
      const category = CATEGORY_MAP[typ] ?? 'Wissen'
      const body = content.replace(/^\s*#\s+.+\n+/, '').trim()
      return {
        slug,
        title: titel,
        excerpt: firstParagraph(content),
        body,
        category,
        tags: deriveTags(slug, zielgruppe, typ),
        cover_image_url: null,
        reading_time_min: readingTime(body),
        featured: slug === 'was-ist-bjj',
        published: true,
        published_at: new Date(datum + 'T10:00:00Z').toISOString(),
      }
    })
  )

  console.log('Prepared rows:')
  for (const r of rows) {
    console.log(`  ${r.slug.padEnd(40)} [${r.category}] ${r.reading_time_min}min  tags=${JSON.stringify(r.tags)}`)
  }

  if (DRY) {
    console.log('\n--dry-run: no database writes made.')
    return
  }

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log('\nDeleting all existing rows from blog_posts ...')
  const { error: delErr } = await supabase
    .from('blog_posts')
    .delete()
    .not('id', 'is', null)
  if (delErr) {
    console.error('Delete failed:', delErr)
    process.exit(1)
  }

  console.log(`Inserting ${rows.length} German articles ...`)
  const { error: insErr, data: inserted } = await supabase
    .from('blog_posts')
    .insert(rows)
    .select('slug')
  if (insErr) {
    console.error('Insert failed:', insErr)
    process.exit(1)
  }

  console.log(`OK — inserted ${inserted?.length ?? 0} posts:`)
  for (const p of inserted ?? []) console.log('  ' + p.slug)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
