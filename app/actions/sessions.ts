'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertStaff } from '@/lib/auth'
import { sessionFormSchema } from './sessions.schema'

export type SessionFormData = {
  id?: string
  class_type_id: string
  coach_id?: string | null
  starts_at: string
  ends_at: string
  capacity: number
  location: string
}

export async function upsertSession(
  data: SessionFormData
): Promise<{ success?: boolean; session?: { id: string }; error?: string }> {
  const parsed = sessionFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const isNew = !data.id

  const { data: session, error } = await supabase
    .from('class_sessions')
    .upsert({
      ...(parsed.data.id ? { id: parsed.data.id } : {}),
      class_type_id: parsed.data.class_type_id,
      coach_id: parsed.data.coach_id ?? null,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      capacity: parsed.data.capacity,
      location: parsed.data.location,
    })
    .select()
    .single()

  if (error) return { error: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' }

  revalidatePath('/admin/klassen')

  // Fire-and-forget notification: look up class type name
  try {
    const { data: classType } = await supabase
      .from('class_types')
      .select('name')
      .eq('id', data.class_type_id)
      .single()
    const className = classType?.name ?? 'Unbekannt'
    if (isNew) {
      waitUntil(notify({
        type: 'session.created',
        data: { className, startsAt: data.starts_at, capacity: data.capacity },
      }))
    } else {
      waitUntil(notify({
        type: 'session.updated',
        data: { className, startsAt: data.starts_at },
      }))
    }
  } catch {
    // best-effort
  }

  return { success: true, session: { id: session.id } }
}

export async function cancelSession(
  sessionId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  // Fetch session info for notification before updating
  const { data: sessionInfo } = await supabase
    .from('class_sessions')
    .select('starts_at, class_types(name)')
    .eq('id', sessionId)
    .single()

  const { error } = await supabase
    .from('class_sessions')
    .update({ cancelled: true })
    .eq('id', sessionId)

  if (error) return { error: 'Absagen fehlgeschlagen. Bitte erneut versuchen.' }

  revalidatePath('/admin/klassen')
  revalidatePath('/admin/checkin')

  if (sessionInfo) {
    const ct = Array.isArray(sessionInfo?.class_types) ? sessionInfo.class_types[0] : sessionInfo?.class_types
    const className = ct?.name ?? 'Unbekannt'
    const startsAt = sessionInfo?.starts_at ?? ''
    waitUntil(notify({
      type: 'session.cancelled',
      data: { className, startsAt },
    }))
  }

  return { success: true }
}
