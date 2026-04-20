'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

export async function exportMyData(): Promise<
  { success: true; data: Record<string, unknown>; filename: string } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  // Fetch everything about the user in parallel
  const [profile, bookings, attendances, ranks, trainingLogs, competitions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, class_sessions(starts_at, ends_at, class_types(name))').eq('profile_id', user.id),
    supabase.from('attendances').select('*, class_sessions(starts_at, class_types(name))').eq('profile_id', user.id),
    supabase.from('profile_ranks').select('*, belt_ranks(name, stripes, color_hex)').eq('profile_id', user.id),
    supabase.from('training_logs').select('*').eq('profile_id', user.id),
    supabase.from('competitions').select('*').eq('profile_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile: profile.data ?? null,
    bookings: bookings.data ?? [],
    attendances: attendances.data ?? [],
    belt_promotions: ranks.data ?? [],
    training_logs: trainingLogs.data ?? [],
    competitions: competitions.data ?? [],
    notice: 'Dies sind alle personenbezogenen Daten die AXIS Jiu-Jitsu Vienna über dich gespeichert hat (DSGVO Art. 20 — Recht auf Datenübertragbarkeit).',
  }

  await logAudit({
    action: 'data.exported',
    targetType: 'profile',
    targetId: user.id,
    targetName: (profile.data as { full_name?: string } | null)?.full_name ?? user.email ?? 'User',
  })

  const date = new Date().toISOString().slice(0, 10)
  return {
    success: true,
    data: exportData,
    filename: `axis-daten-export-${date}.json`,
  }
}
