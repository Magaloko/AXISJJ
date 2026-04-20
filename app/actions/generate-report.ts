'use server'

import { z } from 'zod'
import OpenAI from 'openai'
import { assertStaff } from '@/lib/auth'

const schema = z.object({
  notes: z.string().trim().min(10, 'Mindestens 10 Zeichen Notizen.').max(4000, 'Maximal 4000 Zeichen.'),
  hashtags: z.string().trim().max(500, 'Maximal 500 Zeichen Hashtags.').optional().default(''),
  sessionLabel: z.string().trim().max(120).optional().default(''),
  photoCaptions: z.array(z.string().trim().max(300)).max(20).optional().default([]),
})

export type GenerateReportInput = z.infer<typeof schema>
export type GeneratedReport = {
  title: string
  summary: string
  body_md: string
  instagram_caption: string
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean)
    .slice(0, 20)
}

export async function generateReport(
  input: GenerateReportInput,
): Promise<{ data?: GeneratedReport; error?: string }> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return { error: 'DEEPSEEK_API_KEY ist nicht konfiguriert.' }

  const tags = parseHashtags(parsed.data.hashtags)
  const captions = parsed.data.photoCaptions.filter(Boolean)

  const system = [
    'Du bist ein erfahrener Content-Autor für AXIS Jiu-Jitsu Wien,',
    'einer Brazilian-Jiu-Jitsu-Schule. Du erstellst aus kurzen Trainer-Notizen',
    'hochwertige deutsche Trainingsberichte für Mitglieder und Social-Media.',
    '',
    'Sprache: freundlich, klar, ermutigend, ohne Übertreibung. Du-Form.',
    'BJJ-Fachbegriffe (Guard, Mount, Sweep, Submission, Gi, No-Gi, Open Mat,',
    'Flow Roll, Drilling, Positionssparring) bleiben wie im Deutschen üblich',
    'stehen. Keine Emojis im Body-Markdown; in der Instagram-Caption sparsam',
    'und passend verwenden.',
    '',
    'Antworte AUSSCHLIESSLICH mit gültigem JSON, exakt diese Keys und nichts',
    'außerhalb:',
    '{ "title": string,          // prägnanter Titel, max. 80 Zeichen',
    '  "summary": string,        // 2-3 Sätze Teaser, max. 320 Zeichen',
    '  "body_md": string,        // vollständiger Bericht in Markdown,',
    '                            //   mit Zwischenüberschriften (## ...),',
    '                            //   Aufzählungen wo sinnvoll, 300-600 Wörter',
    '  "instagram_caption": string  // Caption mit kurzem Fließtext + Emojis',
    '                               //   + 5-10 passenden Hashtags am Ende',
    '}',
  ].join('\n')

  const userPayload = {
    session: parsed.data.sessionLabel || null,
    notes: parsed.data.notes,
    hashtags_from_trainer: tags,
    photo_captions: captions,
  }

  const ai = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })

  try {
    const res = await ai.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    })
    const raw = res.choices[0]?.message?.content ?? '{}'
    const data = JSON.parse(raw) as Partial<GeneratedReport>
    if (!data.title || !data.body_md) {
      return { error: 'Antwort vom Modell war unvollständig.' }
    }
    return {
      data: {
        title: String(data.title).trim(),
        summary: String(data.summary ?? '').trim(),
        body_md: String(data.body_md).trim(),
        instagram_caption: String(data.instagram_caption ?? '').trim(),
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-report] failed:', msg)
    return { error: `Generierung fehlgeschlagen: ${msg}` }
  }
}
