// app/actions/skills.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertStaff } from '@/lib/auth'

export async function updateSkillStatus(
  skillId: string,
  status: 'not_started' | 'in_progress' | 'mastered'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('skill_progress')
    .upsert(
      { profile_id: user.id, skill_id: skillId, status },
      { onConflict: 'profile_id,skill_id' }
    )

  if (error) return { error: 'Fehler beim Speichern.' }

  revalidatePath('/skills')
  return { success: true }
}

/**
 * Staff (coach/owner) updates a member's skill status.
 */
export async function updateMemberSkillStatus(
  profileId: string,
  skillId: string,
  status: 'not_started' | 'in_progress' | 'mastered'
): Promise<{ success?: boolean; error?: string }> {
  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('skill_progress')
    .upsert(
      { profile_id: profileId, skill_id: skillId, status },
      { onConflict: 'profile_id,skill_id' }
    )

  if (error) {
    console.error('[skills] member update error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin/mitglieder')
  return { success: true }
}
