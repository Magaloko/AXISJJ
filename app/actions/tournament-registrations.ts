'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RegistrationInput {
  weight_category: string | null
  gi_nogi: 'gi' | 'nogi' | 'both' | null
  notes: string | null
}

export interface Registration {
  id: string
  profileId: string
  memberName: string
  weight_category: string | null
  gi_nogi: 'gi' | 'nogi' | 'both' | null
  notes: string | null
  status: 'pending' | 'approved' | 'denied'
}

export async function registerForTournament(
  tournamentId: string,
  input: RegistrationInput,
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('tournament_registrations')
    .upsert(
      {
        tournament_id: tournamentId,
        profile_id: user.id,
        weight_category: input.weight_category,
        gi_nogi: input.gi_nogi,
        notes: input.notes,
        status: 'pending',
      },
      { onConflict: 'tournament_id,profile_id' },
    )

  if (error) return { error: 'Anmeldung fehlgeschlagen.' }

  revalidatePath('/dashboard/turniere')
  revalidatePath('/admin/turniere')
  return { success: true }
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: 'approved' | 'denied',
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') return { error: 'Keine Berechtigung.' }

  const { error } = await supabase
    .from('tournament_registrations')
    .update({ status })
    .eq('id', registrationId)

  if (error) return { error: 'Update fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function getRegistrationsForTournament(
  tournamentId: string,
): Promise<Registration[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') return []

  const { data } = await supabase
    .from('tournament_registrations')
    .select('id, profile_id, weight_category, gi_nogi, notes, status, profiles(full_name)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    return {
      id: r.id,
      profileId: r.profile_id,
      memberName: p?.full_name ?? 'Unbekannt',
      weight_category: r.weight_category,
      gi_nogi: r.gi_nogi,
      notes: r.notes,
      status: r.status,
    }
  })
}

export async function getMyRegistrations(): Promise<{ tournamentId: string; status: 'pending' | 'approved' | 'denied' }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tournament_registrations')
    .select('tournament_id, status')
    .eq('profile_id', user.id)

  return (data ?? []).map(r => ({ tournamentId: r.tournament_id, status: r.status }))
}
