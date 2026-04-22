'use server'

import { assertOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

export interface ExtractedMemberData {
  vorname: string | null
  nachname: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null  // YYYY-MM-DD
  address: string | null
  raw_text: string
}

// ── Extract member data from uploaded contract ───────────────

export async function extractContractData(
  base64Data: string,
  mimeType: string,
): Promise<{ data?: ExtractedMemberData; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return { error: 'DEEPSEEK_API_KEY nicht konfiguriert.' }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })

  const prompt = `Du bist ein Dateiextraktor für Mitgliedsverträge eines Jiu-Jitsu-Gyms.
Extrahiere aus diesem Dokument folgende Felder und antworte NUR mit validem JSON (kein Markdown, kein Extra-Text):

{
  "vorname": "...",
  "nachname": "...",
  "email": "...",
  "phone": "...",
  "date_of_birth": "YYYY-MM-DD",
  "address": "..."
}

Wenn ein Feld nicht vorhanden oder unleserlich ist, setze den Wert auf null.
Das Datum im Format YYYY-MM-DD zurückgeben (z.B. 1990-05-23).`

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content ?? ''

    let parsed: Record<string, string | null>
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return { error: 'KI-Antwort konnte nicht geparst werden.' }
      parsed = JSON.parse(match[0])
    }

    return {
      data: {
        vorname: parsed.vorname ?? null,
        nachname: parsed.nachname ?? null,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        date_of_birth: parsed.date_of_birth ?? null,
        address: parsed.address ?? null,
        raw_text: text,
      },
    }
  } catch (err: any) {
    return { error: err?.message ?? 'Unbekannter Fehler bei der KI-Extraktion.' }
  }
}

// ── Create member from extracted data ────────────────────────

export async function createMemberFromContract(data: {
  full_name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
}): Promise<{ success?: true; profileId?: string; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  if (!data.full_name?.trim()) return { error: 'Name ist erforderlich.' }
  if (!data.email?.trim()) return { error: 'E-Mail ist erforderlich.' }

  const serviceClient = createServiceRoleClient()

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: data.email.trim(),
    email_confirm: true,
    user_metadata: { full_name: data.full_name.trim() },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Benutzer konnte nicht angelegt werden.' }

  const { error: profileError } = await serviceClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      phone: data.phone ?? null,
      date_of_birth: data.date_of_birth ?? null,
      role: 'member',
    })

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/mitglieder')
  return { success: true, profileId: authData.user.id }
}
