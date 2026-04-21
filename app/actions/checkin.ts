'use server'

import { createClient } from '@/lib/supabase/server'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertStaff } from '@/lib/auth'
import { getActionErrors } from '@/lib/i18n/action-lang'

export async function checkIn(
  profileId: string,
  sessionId: string
): Promise<{ success?: boolean; memberName?: string; error?: string }> {
  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const e = await getActionErrors()

  const supabase = await createClient()

  // Verify profile exists and get member name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', profileId)
    .single()

  if (!profile) return { error: 'Mitglied nicht gefunden.' } // TODO: i18n

  const { error } = await supabase
    .from('attendances')
    .upsert(
      { profile_id: profileId, session_id: sessionId, checked_in_at: new Date().toISOString() },
      { onConflict: 'profile_id,session_id' }
    )

  if (error) return { error: e.saveFailed }

  const memberName = profile.full_name ?? 'Unbekannt'

  // Fire-and-forget notification: fetch class info
  try {
    const { data: sessionInfo } = await supabase
      .from('class_sessions')
      .select('starts_at, class_types(name)')
      .eq('id', sessionId)
      .single()
    const ct = Array.isArray(sessionInfo?.class_types) ? sessionInfo.class_types[0] : sessionInfo?.class_types
    const className = ct?.name ?? 'Unbekannt'
    const startsAt = sessionInfo?.starts_at ?? ''
    waitUntil(notify({
      type: 'checkin.recorded',
      data: { memberName, className, startsAt },
    }))
  } catch {
    // best-effort
  }

  return { success: true, memberName }
}
