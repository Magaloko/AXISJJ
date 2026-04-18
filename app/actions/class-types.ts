'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertOwner(): Promise<true | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return true
}

export interface ClassTypeData {
  id?: string
  name: string
  description?: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

export async function upsertClassType(data: ClassTypeData): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  if (!data.name?.trim()) return { error: 'Name ist Pflicht.' }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    level: data.level,
    gi: data.gi,
  }
  if (data.id) payload.id = data.id

  const { error } = await (supabase.from('class_types') as any).upsert(payload)
  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')
  return { success: true }
}

export async function deleteClassType(id: string): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_type_id', id)
  if (countError) return { error: 'Prüfung fehlgeschlagen.' }
  if ((count ?? 0) > 0) return { error: 'Noch aktive Sessions — zuerst Sessions absagen.' }

  const { error } = await (supabase.from('class_types') as any).delete().eq('id', id)
  if (error) return { error: 'Löschen fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')
  return { success: true }
}
