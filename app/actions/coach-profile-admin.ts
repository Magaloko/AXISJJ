'use server'

import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getActionErrors } from '@/lib/i18n/action-lang'

export interface CoachProfileData {
  profileId: string
  specialization: string | null
  bio: string | null
  achievements: string | null
  showOnWebsite: boolean
  displayOrder: number
}

export async function getCoachProfile(profileId: string): Promise<CoachProfileData | null> {
  const auth = await assertOwner()
  if ('error' in auth) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_profiles')
    .select('profile_id, specialization, bio, achievements, show_on_website, display_order')
    .eq('profile_id', profileId)
    .single()

  if (!data) return null
  return {
    profileId: data.profile_id ?? profileId,
    specialization: data.specialization,
    bio: data.bio,
    achievements: data.achievements,
    showOnWebsite: data.show_on_website,
    displayOrder: data.display_order,
  }
}

export async function upsertCoachProfile(
  profileId: string,
  data: {
    specialization?: string | null
    bio?: string | null
    achievements?: string | null
    showOnWebsite?: boolean
    displayOrder?: number
  },
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const e = await getActionErrors()

  const supabase = await createClient()
  const { error } = await supabase
    .from('coach_profiles')
    .upsert(
      {
        profile_id: profileId,
        specialization: data.specialization ?? null,
        bio: data.bio ?? null,
        achievements: data.achievements ?? null,
        show_on_website: data.showOnWebsite ?? false,
        display_order: data.displayOrder ?? 99,
      },
      { onConflict: 'profile_id' },
    )

  if (error) return { error: e.coachProfileSaveFailed }

  revalidatePath('/')
  revalidatePath('/admin/mitglieder')
  return { success: true }
}
