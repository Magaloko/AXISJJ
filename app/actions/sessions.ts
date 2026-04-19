'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

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
): Promise<{ success?: boolean; session?: { id: string }; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['coach', 'owner'].includes(callerProfile.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  const isNew = !data.id

  const { data: session, error } = await supabase
    .from('class_sessions')
    .upsert({
      ...(data.id ? { id: data.id } : {}),
      class_type_id: data.class_type_id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      capacity: data.capacity,
      location: data.location,
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
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['coach', 'owner'].includes(callerProfile.role)) {
    return { error: 'Keine Berechtigung.' }
  }

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
