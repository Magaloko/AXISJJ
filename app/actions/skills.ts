// app/actions/skills.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
