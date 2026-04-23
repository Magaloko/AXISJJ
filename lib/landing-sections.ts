/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export type LandingSectionKey = 'head_coach_spotlight' | 'contact_card'

export interface LandingSection {
  key: LandingSectionKey
  label: string
  description: string | null
  enabled: boolean
  sort_order: number
}

const ALL_KEYS: LandingSectionKey[] = ['head_coach_spotlight', 'contact_card']

/** Returns a set of enabled section keys — used during SSR of the landing page. */
export async function getEnabledLandingSections(): Promise<Set<LandingSectionKey>> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('landing_sections')
    .select('key, enabled') as { data: { key: string; enabled: boolean }[] | null }

  if (!data) return new Set<LandingSectionKey>(ALL_KEYS)

  return new Set(
    data.filter(s => s.enabled).map(s => s.key as LandingSectionKey),
  )
}

/** Returns all sections with metadata — for the developer panel. */
export async function getAllLandingSections(): Promise<LandingSection[]> {
  const supabase = createServiceRoleClient()
  const { data } = await (supabase as any)
    .from('landing_sections')
    .select('*')
    .order('sort_order', { ascending: true }) as { data: LandingSection[] | null }

  return data ?? []
}

/** Toggle a section on/off (role enforcement happens in the server action). */
export async function setLandingSectionEnabled(key: LandingSectionKey, enabled: boolean): Promise<void> {
  const supabase = createServiceRoleClient()
  await (supabase as any)
    .from('landing_sections')
    .update({ enabled })
    .eq('key', key)
}
