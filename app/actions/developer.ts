'use server'

import { createClient } from '@/lib/supabase/server'
import { isOwnerLevel } from '@/lib/auth/roles'
import { setModuleEnabled, type ModuleKey } from '@/lib/dashboard-modules'
import { setLandingSectionEnabled, type LandingSectionKey } from '@/lib/landing-sections'
import { revalidatePath } from 'next/cache'

async function assertOwnerOrDev() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!isOwnerLevel(profile?.role)) return { error: 'not_authorized' }
  return { error: null }
}

export async function toggleDashboardModule(
  key: ModuleKey,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertOwnerOrDev()
  if (auth.error) return { success: false, error: auth.error }

  await setModuleEnabled(key, enabled)
  revalidatePath('/dashboard')
  revalidatePath('/admin/developer')
  return { success: true }
}

export async function toggleLandingSection(
  key: LandingSectionKey,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertOwnerOrDev()
  if (auth.error) return { success: false, error: auth.error }

  await setLandingSectionEnabled(key, enabled)
  revalidatePath('/', 'layout')
  revalidatePath('/admin/developer')
  return { success: true }
}
