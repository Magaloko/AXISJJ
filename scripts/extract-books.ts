/**
 * One-off helper: extracts text from BJJ books in C:\Users\Mago\Downloads\AXISJJ APP\Books
 * to .tmp/books/*.txt so we can scan TOCs + pick curriculum content.
 *
 * Run:  npx tsx scripts/extract-books.ts
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'

const BOOKS_DIR = 'C:\\Users\\Mago\\Downloads\\AXISJJ APP\\Books'
const OUT_DIR   = '.tmp/books'

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const files = await readdir(BOOKS_DIR)

  for (const file of files) {
    const full = join(BOOKS_DIR, file)
    const ext = extname(file).toLowerCase()
    const short = basename(file).slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()
    const outFile = join(OUT_DIR, `${short}.txt`)

    try {
      let text = ''
      if (ext === '.pdf') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error pdf-parse has no types for inner path
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
        const buf = await readFile(full)
        const parsed = await pdfParse(buf)
        text = parsed.text as string
      } else if (ext === '.epub') {
        const { EPub } = await import('epub2')
        const epub = await EPub.createAsync(full)
        const chapters: string[] = []
        for (const chap of epub.flow) {
          if (!chap.id) continue
          const html = await epub.getChapterAsync(chap.id)
          chapters.push(`\n\n### ${chap.title ?? chap.id}\n\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}`)
        }
        text = chapters.join('\n')
      } else {
        continue
      }

      await writeFile(outFile, text, 'utf-8')
      console.log(`✓ ${file} → ${outFile} (${text.length.toLocaleString()} chars)`)
    } catch (e) {
      console.error(`✗ ${file}: ${(e as Error).message}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
