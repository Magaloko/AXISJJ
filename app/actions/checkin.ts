'use server'

import { createClient } from '@/lib/supabase/server'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

export async function checkIn(
  profileId: string,
  sessionId: string
): Promise<{ success?: boolean; memberName?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  // Verify caller is a coach or owner
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['coach', 'owner'].includes(callerProfile.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  // Verify profile exists and get member name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', profileId)
    .single()

  if (!profile) return { error: 'Mitglied nicht gefunden.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('attendances')
    .upsert(
      { profile_id: profileId, session_id: sessionId, checked_in_at: new Date().toISOString() } as any,
      { onConflict: 'profile_id,session_id' }
    )

  if (error) return { error: 'Check-In fehlgeschlagen. Bitte erneut versuchen.' }

  const memberName = profile.full_name ?? 'Unbekannt'

  // Fire-and-forget notification: fetch class info
  try {
    const { data: sessionInfo } = await supabase
      .from('class_sessions')
      .select('starts_at, class_types(name)')
      .eq('id', sessionId)
      .single()
    const classTypes = (sessionInfo as { class_types?: { name?: string } | { name?: string }[] } | null)?.class_types
    const ct = Array.isArray(classTypes) ? classTypes[0] : classTypes
    const className = ct?.name ?? 'Unbekannt'
    const startsAt = (sessionInfo as { starts_at?: string } | null)?.starts_at ?? ''
    waitUntil(notify({
      type: 'checkin.recorded',
      data: { memberName, className, startsAt },
    }))
  } catch {
    // best-effort
  }

  return { success: true, memberName }
}
