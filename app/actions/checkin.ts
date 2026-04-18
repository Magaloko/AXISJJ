'use server'

import { createClient } from '@/lib/supabase/server'

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

  return { success: true, memberName: profile.full_name ?? 'Unbekannt' }
}
