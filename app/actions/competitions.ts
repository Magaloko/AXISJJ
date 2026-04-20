'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface Competition {
  id: string
  profile_id: string
  name: string
  date: string
  location: string | null
  category: string | null
  placement: string | null
  notes: string | null
  created_at: string
}

const competitionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name des Turniers ist Pflicht').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  location: z.string().max(200).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  placement: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export type CompetitionInput = z.infer<typeof competitionSchema>

export async function upsertCompetition(
  data: CompetitionInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = competitionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const payload = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    profile_id: user.id,
    name: parsed.data.name.trim(),
    date: parsed.data.date,
    location: parsed.data.location?.trim() || null,
    category: parsed.data.category?.trim() || null,
    placement: parsed.data.placement?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  }

  const { data: row, error } = await supabase
    .from('competitions')
    .upsert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[competitions] upsert error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin/mitglieder')
  return { success: true, id: row.id }
}

export async function deleteCompetition(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase.from('competitions').delete().eq('id', id)
  if (error) {
    console.error('[competitions] delete error:', error)
    return { error: `Löschen fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getMyCompetitions(): Promise<Competition[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('competitions')
    .select('*')
    .eq('profile_id', user.id)
    .order('date', { ascending: false })

  return data ?? []
}
