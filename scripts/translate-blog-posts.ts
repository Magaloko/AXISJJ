#!/usr/bin/env tsx
/**
 * Translates all English blog_posts rows in Supabase to German in place.
 *
 * Detects English posts heuristically (common English stop-words in title/body
 * that would not appear in German). Each detected row is translated via the
 * DeepSeek Chat API (OpenAI-compatible): title, excerpt and body are translated
 * while slug, id, tags, published/featured flags and timestamps are preserved.
 * Category is remapped to one of: Grundlagen | Wissen | Erfahrungen | Team.
 *
 * Safe to re-run: once a row is German the heuristic skips it.
 *
 * Required env vars (via .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   - service role, bypasses RLS (never commit)
 *   DEEPSEEK_API_KEY            - used for translation (https://platform.deepseek.com)
 *
 * Usage:
 *   npx tsx scripts/translate-blog-posts.ts
 *   npx tsx scripts/translate-blog-posts.ts --dry-run
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

config({ path: '.env.local' })
config()

const dry = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!DEEPSEEK_KEY) {
  console.error('Missing DEEPSEEK_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// DeepSeek exposes an OpenAI-compatible Chat Completions API.
const ai = new OpenAI({
  apiKey: DEEPSEEK_KEY,
  baseURL: 'https://api.deepseek.com',
})
const MODEL = 'deepseek-chat'

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  category: string | null
  tags: string[] | null
  published: boolean
}

const CATEGORY_MAP: Record<string, string> = {
  basics: 'Grundlagen',
  fundamentals: 'Grundlagen',
  beginner: 'Grundlagen',
  knowledge: 'Wissen',
  guide: 'Wissen',
  tips: 'Wissen',
  seo: 'Wissen',
  experience: 'Erfahrungen',
  story: 'Erfahrungen',
  review: 'Erfahrungen',
  team: 'Team',
  coach: 'Team',
  trainer: 'Team',
  profile: 'Team',
}

function mapCategory(input: string | null): string {
  if (!input) return 'Wissen'
  const k = input.trim().toLowerCase()
  if (['grundlagen', 'wissen', 'erfahrungen', 'team'].includes(k)) {
    return k.charAt(0).toUpperCase() + k.slice(1)
  }
  for (const [en, de] of Object.entries(CATEGORY_MAP)) {
    if (k.includes(en)) return de
  }
  return 'Wissen'
}

// Heuristic: treat a row as English if it contains common English words
// that would not appear in a German article. Strong signals only.
function looksEnglish(post: Post): boolean {
  const sample = `${post.title} ${post.excerpt ?? ''} ${post.body.slice(0, 600)}`.toLowerCase()
  const markers = [
    ' the ', ' and ', ' with ', ' your ', ' you ', ' for ', ' that ',
    ' this ', ' about ', ' from ', ' which ', ' these ', ' their ',
    ' have ', ' will ', ' here ', ' there ', ' what ',
  ]
  let hits = 0
  for (const m of markers) if (sample.includes(m)) hits++
  return hits >= 3
}

async function translate(post: Post): Promise<{ title: string; excerpt: string; body: string }> {
  const system =
    'You are a professional translator specialising in Brazilian Jiu-Jitsu (BJJ) and martial-arts content. Translate the provided JSON fields from English into natural, fluent German suitable for a BJJ school blog in Vienna, Austria. Preserve Markdown formatting (headings, lists, links, bold/italic, code blocks) exactly. Keep proper nouns, brand names and BJJ-specific terms (e.g. "Gi", "No-Gi", "Open Mat", "Mount", "Guard") as they are commonly used in German BJJ language. Do NOT translate the slug. Return ONLY valid JSON with exactly the keys title, excerpt, body — no prose, no code fences.'
  const user = JSON.stringify({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    body: post.body,
  })

  const res = await ai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  const raw = res.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as { title?: string; excerpt?: string; body?: string }
  return {
    title: parsed.title?.trim() || post.title,
    excerpt: parsed.excerpt?.trim() || post.excerpt || '',
    body: parsed.body?.trim() || post.body,
  }
}

async function main() {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, body, category, tags, published')
  if (error) {
    console.error('Fetch failed:', error)
    process.exit(1)
  }
  if (!posts || posts.length === 0) {
    console.log('No blog_posts rows found — nothing to translate.')
    return
  }

  console.log(`Scanning ${posts.length} rows ...`)
  const candidates = (posts as Post[]).filter(looksEnglish)
  const skipped = posts.length - candidates.length
  console.log(`\n  → ${candidates.length} look English, ${skipped} already German (skipped)`)

  if (candidates.length === 0) {
    console.log('\nNothing to do. All rows appear to be German already.')
    return
  }

  for (const c of candidates) {
    console.log(`  translating: ${c.slug.padEnd(40)} [${c.category ?? '?'} → ${mapCategory(c.category)}] published=${c.published}`)
  }

  if (dry) {
    console.log('\n--dry-run: no API calls, no DB writes.')
    return
  }

  let ok = 0
  let fail = 0
  for (const post of candidates) {
    try {
      const t = await translate(post)
      const newCategory = mapCategory(post.category)
      const { error: upErr } = await supabase
        .from('blog_posts')
        .update({
          title: t.title,
          excerpt: t.excerpt,
          body: t.body,
          category: newCategory,
        })
        .eq('id', post.id)
      if (upErr) {
        console.error(`  ✗ ${post.slug}: ${upErr.message}`)
        fail++
      } else {
        console.log(`  ✓ ${post.slug} → ${newCategory}`)
        ok++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`  ✗ ${post.slug}: ${msg}`)
      fail++
    }
  }

  console.log(`\nDone: ${ok} translated, ${fail} failed.`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
