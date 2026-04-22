'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertStaff } from '@/lib/auth'
import { z } from 'zod'

const pairingSchema = z.object({
  session_id: z.string().uuid(),
  profile_a_id: z.string().uuid(),
  profile_b_id: z.string().uuid(),
  outcome: z.enum(['a_wins', 'b_wins', 'draw']).nullable().optional(),
  rounds: z.number().int().min(1).max(20).default(1),
  notes: z.string().max(500).nullable().optional(),
})

export interface SparringPairing {
  id: string
  session_id: string
  profile_a_id: string
  profile_b_id: string
  profile_a_name: string | null
  profile_b_name: string | null
  outcome: 'a_wins' | 'b_wins' | 'draw' | null
  rounds: number
  notes: string | null
  created_at: string
}

export interface SparringRecord {
  profile_id: string
  profile_name: string | null
  wins: number
  losses: number
  draws: number
  total: number
  win_rate: number
}

// ── Toggle sparring flag on session ─────────────────────────

export async function setSessionSparring(
  sessionId: string,
  isSparring: boolean
): Promise<{ success?: true; error?: string }> {
  const check = await assertStaff()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('class_sessions' as any)
    .update({ is_sparring: isSparring } as any)
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/klassen/${sessionId}`)
  return { success: true }
}

// ── Add pairing ──────────────────────────────────────────────

export async function addSparringPairing(data: {
  session_id: string
  profile_a_id: string
  profile_b_id: string
  outcome?: 'a_wins' | 'b_wins' | 'draw' | null
  rounds?: number
  notes?: string | null
}): Promise<{ id?: string; error?: string }> {
  const check = await assertStaff()
  if ('error' in check) return { error: check.error }

  const parsed = pairingSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  if (parsed.data.profile_a_id === parsed.data.profile_b_id)
    return { error: 'Sparring-Partner müssen unterschiedliche Personen sein.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: row, error } = await (supabase as any)
    .from('sparring_pairings')
    .insert({
      session_id: parsed.data.session_id,
      profile_a_id: parsed.data.profile_a_id,
      profile_b_id: parsed.data.profile_b_id,
      outcome: parsed.data.outcome ?? null,
      rounds: parsed.data.rounds,
      notes: parsed.data.notes ?? null,
      recorded_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/admin/klassen/${data.session_id}`)
  return { id: row.id }
}

// ── Update pairing outcome ───────────────────────────────────

export async function updateSparringOutcome(
  pairingId: string,
  outcome: 'a_wins' | 'b_wins' | 'draw' | null,
  sessionId: string,
): Promise<{ success?: true; error?: string }> {
  const check = await assertStaff()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('sparring_pairings')
    .update({ outcome })
    .eq('id', pairingId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/klassen/${sessionId}`)
  return { success: true }
}

// ── Delete pairing ───────────────────────────────────────────

export async function deleteSparringPairing(
  pairingId: string,
  sessionId: string,
): Promise<{ success?: true; error?: string }> {
  const check = await assertStaff()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('sparring_pairings')
    .delete()
    .eq('id', pairingId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/klassen/${sessionId}`)
  return { success: true }
}

// ── Get pairings for a session ───────────────────────────────

export async function getSessionPairings(sessionId: string): Promise<SparringPairing[]> {
  const check = await assertStaff()
  if ('error' in check) return []

  const supabase = await createClient()
  const { data: pairings } = await (supabase as any)
    .from('sparring_pairings')
    .select('id, session_id, profile_a_id, profile_b_id, outcome, rounds, notes, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (!pairings?.length) return []

  const ids = [
    ...new Set([
      ...(pairings as any[]).map((p: any) => p.profile_a_id),
      ...(pairings as any[]).map((p: any) => p.profile_b_id),
    ])
  ]
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))

  return (pairings as any[]).map((p: any) => ({
    ...p,
    profile_a_name: nameMap.get(p.profile_a_id) ?? null,
    profile_b_name: nameMap.get(p.profile_b_id) ?? null,
  }))
}

// ── Sparring records per member (overall) ───────────────────

export async function getSparringRecords(profileIds?: string[]): Promise<SparringRecord[]> {
  const check = await assertStaff()
  if ('error' in check) return []

  const supabase = await createClient()

  let query = (supabase as any)
    .from('sparring_pairings')
    .select('profile_a_id, profile_b_id, outcome')

  if (profileIds?.length) {
    query = query.or(`profile_a_id.in.(${profileIds.join(',')}),profile_b_id.in.(${profileIds.join(',')})`)
  }

  const { data: pairings } = await query
  if (!pairings?.length) return []

  const recordMap = new Map<string, { wins: number; losses: number; draws: number; total: number }>()
  const bump = (id: string) => {
    if (!recordMap.has(id)) recordMap.set(id, { wins: 0, losses: 0, draws: 0, total: 0 })
    return recordMap.get(id)!
  }

  for (const p of pairings as any[]) {
    const a = bump(p.profile_a_id)
    const b = bump(p.profile_b_id)
    a.total++; b.total++
    if (p.outcome === 'a_wins') { a.wins++; b.losses++ }
    else if (p.outcome === 'b_wins') { b.wins++; a.losses++ }
    else if (p.outcome === 'draw') { a.draws++; b.draws++ }
  }

  const allIds = [...recordMap.keys()]
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', allIds)
  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))

  return [...recordMap.entries()].map(([id, r]) => ({
    profile_id: id,
    profile_name: nameMap.get(id) ?? null,
    ...r,
    win_rate: r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0,
  })).sort((a, b) => b.wins - a.wins)
}
