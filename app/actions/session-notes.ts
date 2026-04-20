'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertStaff } from '@/lib/auth'

export interface SessionNote {
  id: string
  session_id: string
  author_id: string | null
  author_name: string | null
  plan: string | null
  reflection: string | null
  created_at: string
  updated_at: string
  is_mine: boolean
}

const upsertSchema = z.object({
  session_id: z.string().uuid(),
  plan:       z.string().max(5000).optional().nullable(),
  reflection: z.string().max(5000).optional().nullable(),
})

export async function upsertSessionNote(
  data: z.infer<typeof upsertSchema>,
): Promise<{ success?: true; error?: string }> {
  const parsed = upsertSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('session_notes').upsert({
    session_id: parsed.data.session_id,
    author_id:  auth.userId,
    plan:       parsed.data.plan?.trim() || null,
    reflection: parsed.data.reflection?.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id,author_id' })

  if (error) {
    console.error('[session-notes] upsert error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/klassen')
  return { success: true }
}

export async function getSessionNotes(sessionId: string): Promise<SessionNote[]> {
  const auth = await assertStaff()
  if ('error' in auth) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('session_notes')
    .select('id, session_id, author_id, plan, reflection, created_at, updated_at, profiles!session_notes_author_id_fkey(full_name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      session_id: row.session_id,
      author_id: row.author_id,
      author_name: author?.full_name ?? null,
      plan: row.plan,
      reflection: row.reflection,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_mine: row.author_id === auth.userId,
    }
  })
}
