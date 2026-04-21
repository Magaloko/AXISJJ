'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertStaff } from '@/lib/auth'
import { sessionFormSchema } from './sessions.schema'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'
import { getActionErrors } from '@/lib/i18n/action-lang'

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

  const e = await getActionErrors()

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

  if (error) return { error: e.saveFailed }

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
      waitUntil(logAudit({
        action: 'session.created',
        targetType: 'class_session',
        targetId: session.id,
        targetName: className,
        meta: { startsAt: data.starts_at, capacity: data.capacity },
      }))
    } else {
      waitUntil(notify({
        type: 'session.updated',
        data: { className, startsAt: data.starts_at },
      }))
      waitUntil(logAudit({
        action: 'session.updated',
        targetType: 'class_session',
        targetId: session.id,
        targetName: className,
        meta: { startsAt: data.starts_at },
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

  if (error) return { error: 'Absagen fehlgeschlagen. Bitte erneut versuchen.' } // TODO: i18n

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
    waitUntil(logAudit({
      action: 'session.cancelled',
      targetType: 'class_session',
      targetId: sessionId,
      targetName: className,
      meta: { startsAt },
    }))
  }

  return { success: true }
}

// ────────── Recurring / bulk-create ──────────

const recurringSchema = z.object({
  class_type_id: z.string().uuid('Ungültiger Klassentyp'),
  coach_id:      z.string().uuid().nullable().optional(),
  start_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Startdatum'),
  end_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Enddatum'),
  start_time:    z.string().regex(/^\d{2}:\d{2}$/, 'Ungültige Startzeit'),
  end_time:      z.string().regex(/^\d{2}:\d{2}$/, 'Ungültige Endzeit'),
  weekdays:      z.array(z.number().int().min(0).max(6)).min(1, 'Mindestens einen Wochentag auswählen'),
  capacity:      z.number().int().min(1).max(200),
  location:      z.string().min(1).max(200),
})

export type RecurringSessionInput = z.infer<typeof recurringSchema>

export async function createRecurringSessions(
  data: RecurringSessionInput,
): Promise<{ success?: true; count?: number; error?: string }> {
  const parsed = recurringSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  if (parsed.data.start_date > parsed.data.end_date) return { error: 'Enddatum muss nach Startdatum liegen.' }
  if (parsed.data.start_time >= parsed.data.end_time) return { error: 'Endzeit muss nach Startzeit liegen.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  // Generate all target dates between start_date and end_date on matching weekdays
  const start = new Date(parsed.data.start_date + 'T00:00:00')
  const end   = new Date(parsed.data.end_date + 'T00:00:00')
  const weekdaySet = new Set(parsed.data.weekdays)
  const dates: string[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (weekdaySet.has(d.getDay())) dates.push(d.toISOString().slice(0, 10))
  }

  if (dates.length === 0) return { error: 'Keine passenden Tage im angegebenen Zeitraum.' }
  if (dates.length > 200) return { error: 'Zu viele Sessions (>200). Bitte Zeitraum kürzen.' }

  const groupId = crypto.randomUUID()
  const rows = dates.map(date => ({
    class_type_id: parsed.data.class_type_id,
    coach_id:      parsed.data.coach_id ?? null,
    starts_at:     `${date}T${parsed.data.start_time}:00`,
    ends_at:       `${date}T${parsed.data.end_time}:00`,
    capacity:      parsed.data.capacity,
    location:      parsed.data.location,
    recurring_group_id: groupId,
  }))

  const { error } = await supabase.from('class_sessions').insert(rows)
  if (error) {
    console.error('[sessions] createRecurring error:', error)
    return { error: `Erstellen fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/klassen')
  return { success: true, count: dates.length }
}
