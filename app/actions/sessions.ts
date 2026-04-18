'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SessionFormData {
  id?: string
  class_type_id: string
  starts_at: string
  ends_at: string
  capacity: number
  location: string
}

export async function upsertSession(
  data: SessionFormData
): Promise<{ success?: boolean; session?: Record<string, unknown>; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await supabase
    .from('class_sessions')
    .upsert({
      ...(data.id ? { id: data.id } : {}),
      class_type_id: data.class_type_id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      capacity: data.capacity,
      location: data.location,
    } as any)
    .select()
    .single()

  if (error) return { error: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' }

  revalidatePath('/admin/klassen')
  return { success: true, session: session as Record<string, unknown> }
}

export async function cancelSession(
  sessionId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('class_sessions')
    .update({ cancelled: true })
    .eq('id', sessionId)

  if (error) return { error: 'Absagen fehlgeschlagen. Bitte erneut versuchen.' }

  revalidatePath('/admin/klassen')
  revalidatePath('/admin/checkin')
  return { success: true }
}
