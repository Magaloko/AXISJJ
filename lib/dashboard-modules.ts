/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export type ModuleKey =
  | 'next_class'
  | 'xp'
  | 'training_stats'
  | 'frequency_chart'
  | 'mood_chart'
  | 'skill_radar'
  | 'belt_progress'
  | 'motivation'
  | 'subscription'
  | 'leaderboard'
  | 'training_partners'
  | 'competitions'
  | 'qr_code'
  | 'opening_hours'

export interface DashboardModule {
  key: ModuleKey
  label: string
  description: string | null
  enabled: boolean
  sort_order: number
}

/**
 * Returns a set of enabled module keys — fast for dashboard rendering.
 * NOTE: dashboard_modules table is added via migration 20260422_developer_role_and_modules.sql.
 * Until Supabase types are regenerated we use `any` casts; at runtime the query works correctly.
 */
export async function getEnabledModules(): Promise<Set<ModuleKey>> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('dashboard_modules')
    .select('key, enabled') as { data: { key: string; enabled: boolean }[] | null }

  if (!data) {
    // If table doesn't exist yet (migration not run), enable everything
    return new Set<ModuleKey>([
      'next_class', 'xp', 'training_stats', 'frequency_chart',
      'mood_chart', 'skill_radar', 'belt_progress', 'motivation',
      'subscription', 'leaderboard', 'training_partners', 'competitions',
      'qr_code', 'opening_hours',
    ])
  }

  return new Set(
    data.filter(m => m.enabled).map(m => m.key as ModuleKey),
  )
}

/** Returns all modules with full metadata (for the developer panel). */
export async function getAllModules(): Promise<DashboardModule[]> {
  const supabase = createServiceRoleClient()
  const { data } = await (supabase as any)
    .from('dashboard_modules')
    .select('*')
    .order('sort_order', { ascending: true }) as { data: DashboardModule[] | null }

  return data ?? []
}

/** Toggle a module on/off (developer/owner only — enforced by RLS + server action). */
export async function setModuleEnabled(key: ModuleKey, enabled: boolean): Promise<void> {
  const supabase = createServiceRoleClient()
  await (supabase as any)
    .from('dashboard_modules')
    .update({ enabled })
    .eq('key', key)
}
