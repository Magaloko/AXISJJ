'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertOwner } from '@/lib/auth'

export interface ClassTypeData {
  id?: string
  name: string
  description?: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

export async function upsertClassType(data: ClassTypeData): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if ('error' in ok) return { error: ok.error }

  if (!data.name?.trim()) return { error: 'Name ist Pflicht.' }

  const isNew = !data.id

  const supabase = await createClient()
  const name = data.name.trim()

  const { error } = await supabase.from('class_types').upsert({
    ...(data.id ? { id: data.id } : {}),
    name,
    description: data.description?.trim() || null,
    level: data.level,
    gi: data.gi,
  })
  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')

  waitUntil(notify({
    type: 'classtype.upserted',
    data: { name, isNew },
  }))
  return { success: true }
}

export async function deleteClassType(id: string): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if ('error' in ok) return { error: ok.error }

  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_type_id', id)
  if (countError) return { error: 'Prüfung fehlgeschlagen.' }
  if ((count ?? 0) > 0) return { error: 'Noch aktive Sessions — zuerst Sessions absagen.' }

  // Fetch name before delete for notification
  const { data: existing } = await supabase
    .from('class_types')
    .select('name')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('class_types').delete().eq('id', id)
  if (error) return { error: 'Löschen fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')

  const name = existing?.name ?? 'Unbekannt'
  waitUntil(notify({
    type: 'classtype.deleted',
    data: { name },
  }))
  return { success: true }
}
