import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPost {
  slug: string
  title: string
  date: string
  type: string
  audience: string
  excerpt: string
  content: string
}

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  type: string
  audience: string
  excerpt: string
}

function firstParagraph(markdown: string): string {
  const lines = markdown.split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('#')) continue
    if (t.startsWith('---')) continue
    return t.replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 180) + '…'
  }
  return ''
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const files = await fs.readdir(BLOG_DIR)
  const posts = await Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, '')
        const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8')
        const { data, content } = matter(raw)
        return {
          slug,
          title:    String(data.titel ?? slug),
          date:     String(data.datum ?? ''),
          type:     String(data.typ ?? 'artikel'),
          audience: String(data.zielgruppe ?? 'alle'),
          excerpt:  firstParagraph(content),
        }
      })
  )
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.md`), 'utf-8')
    const { data, content } = matter(raw)
    return {
      slug,
      title:    String(data.titel ?? slug),
      date:     String(data.datum ?? ''),
      type:     String(data.typ ?? 'artikel'),
      audience: String(data.zielgruppe ?? 'alle'),
      excerpt:  firstParagraph(content),
      content,
    }
  } catch {
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR)
  return files.filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
}
