'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertStaff } from '@/lib/auth'

export interface CoachNote {
  id: string
  profile_id: string
  author_id: string | null
  author_name: string | null
  content: string
  created_at: string
  updated_at: string
  is_mine: boolean
}

const addNoteSchema = z.object({
  profile_id: z.string().uuid(),
  content: z.string().min(1, 'Notiz darf nicht leer sein').max(2000, 'Max. 2000 Zeichen'),
})

export async function addCoachNote(
  data: z.infer<typeof addNoteSchema>,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = addNoteSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('coach_notes')
    .insert({
      profile_id: parsed.data.profile_id,
      author_id:  auth.userId,
      content:    parsed.data.content.trim(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[coach-notes] insert error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/mitglieder')
  revalidatePath('/admin/dashboard')
  return { success: true, id: row.id }
}

const updateNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

export async function updateCoachNote(
  data: z.infer<typeof updateNoteSchema>,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateNoteSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('coach_notes')
    .update({ content: parsed.data.content.trim(), updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)

  if (error) {
    console.error('[coach-notes] update error:', error)
    return { error: `Aktualisieren fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/mitglieder')
  return { success: true }
}

export async function deleteCoachNote(id: string): Promise<{ success?: true; error?: string }> {
  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('coach_notes').delete().eq('id', id)
  if (error) {
    console.error('[coach-notes] delete error:', error)
    return { error: `Löschen fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/mitglieder')
  return { success: true }
}

export async function getCoachNotes(profileId: string): Promise<CoachNote[]> {
  const auth = await assertStaff()
  if ('error' in auth) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_notes')
    .select('id, profile_id, author_id, content, created_at, updated_at, profiles!coach_notes_author_id_fkey(full_name)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      profile_id: row.profile_id,
      author_id: row.author_id,
      author_name: author?.full_name ?? null,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_mine: row.author_id === auth.userId,
    }
  })
}
