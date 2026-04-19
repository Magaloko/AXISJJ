import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })

const BOOKS_DIR = 'C:/Users/Mago/Downloads/AXISJJ APP/Books'
const CATEGORIES = ['Techniques', 'Rules & Scoring', 'History', 'Belt System', 'Competition', 'Mindset', 'Nutrition', 'No-Gi', 'Kids BJJ']

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function estimateReadingTime(text: string): number {
  return Math.max(3, Math.round(text.split(/\s+/).length / 200))
}

async function extractPdf(filePath: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)
  const text = data.text as string
  const chunks: string[] = []
  const paragraphs = text.split(/\n{2,}/)
  let current = ''
  for (const para of paragraphs) {
    current += '\n' + para
    if (current.split(/\s+/).length > 900) {
      if (current.trim().length > 200) chunks.push(current.trim())
      current = ''
    }
  }
  if (current.trim().length > 200) chunks.push(current.trim())
  return chunks
}

async function extractEpub(filePath: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EPub = require('epub2').EPub
  return new Promise((resolve, reject) => {
    const epub = new EPub(filePath)
    epub.on('end', () => {
      const chapters: string[] = []
      const flow = epub.flow as { id: string }[]
      let processed = 0
      if (flow.length === 0) { resolve([]); return }
      flow.forEach((chapter: { id: string }) => {
        epub.getChapter(chapter.id, (err: Error | null, text: string) => {
          processed++
          if (!err && text) {
            const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            if (clean.length > 300) chapters.push(clean)
          }
          if (processed === flow.length) resolve(chapters)
        })
      })
    })
    epub.on('error', reject)
    epub.parse()
  })
}

async function rewriteWithClaude(chunk: string, bookTitle: string): Promise<{
  title: string
  excerpt: string
  body: string
  category: string
  tags: string[]
} | null> {
  const prompt = `You are a BJJ blog editor. Rewrite the following excerpt from "${bookTitle}" as a standalone blog article for a BJJ gym website.

Return ONLY a JSON object with these fields:
- title: punchy blog headline (max 70 chars)
- excerpt: 1-2 sentence summary (max 180 chars)
- body: full markdown article with ## section headings and > blockquotes for key insights (600-1200 words)
- category: exactly one of: ${CATEGORIES.join(', ')}
- tags: array of 2-4 lowercase tags

Source excerpt:
${chunk.slice(0, 3000)}

Return only the JSON, no other text.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

async function main() {
  const files = fs.readdirSync(BOOKS_DIR)
  let created = 0
  let skipped = 0

  for (const file of files) {
    const filePath = path.join(BOOKS_DIR, file)
    const ext = path.extname(file).toLowerCase()
    const bookTitle = path.basename(file, ext)
    console.log(`\nProcessing: ${file}`)

    let chunks: string[] = []
    if (ext === '.pdf') {
      chunks = await extractPdf(filePath)
    } else if (ext === '.epub') {
      chunks = await extractEpub(filePath)
    } else {
      console.log('  Skipping unsupported format')
      continue
    }

    console.log(`  ${chunks.length} chunks extracted`)
    const toProcess = chunks.slice(0, 6)

    for (const chunk of toProcess) {
      const article = await rewriteWithClaude(chunk, bookTitle)
      if (!article) { console.log('  Claude returned null, skipping chunk'); continue }

      const slug = slugify(article.title)
      const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', slug).single()
      if (existing) { skipped++; console.log(`  Skipped (duplicate): ${article.title}`); continue }

      const { error } = await supabase.from('blog_posts').insert({
        slug,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        category: article.category,
        tags: article.tags,
        reading_time_min: estimateReadingTime(article.body),
        published: false,
      })

      if (error) {
        console.log(`  Error inserting "${article.title}": ${error.message}`)
      } else {
        created++
        console.log(`  Created: ${article.title}`)
      }

      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped (duplicates): ${skipped}`)
}

main().catch(console.error)
