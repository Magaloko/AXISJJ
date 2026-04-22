'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { tournamentInputSchema, type TournamentInput } from './tournaments.schema'
import { getActionErrors } from '@/lib/i18n/action-lang'

export interface Tournament {
  id: string
  name: string
  date: string
  end_date: string | null
  location: string
  type: 'internal' | 'external'
  description: string | null
  registration_deadline: string | null
  coach_id: string | null
  status: 'pending_approval' | 'approved' | 'cancelled'
  created_at: string
}

async function getCallerRole(): Promise<'member' | 'coach' | 'owner' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return (data?.role as 'member' | 'coach' | 'owner' | null) ?? null
}

export async function createTournament(
  input: TournamentInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = tournamentInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const e = await getActionErrors()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: e.notAuthenticated }

  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: e.notAuthorized }

  const status = role === 'owner' ? 'approved' : 'pending_approval'

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location,
      type: parsed.data.type,
      description: parsed.data.description?.trim() || null,
      registration_deadline: parsed.data.registration_deadline || null,
      coach_id: user.id,
      status,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[tournaments] create error:', error)
    return { error: `${e.saveFailed}: ${error.message}` }
  }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true, id: data.id }
}

export async function updateTournament(
  id: string,
  input: TournamentInput,
): Promise<{ success?: true; error?: string }> {
  const parsed = tournamentInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const e = await getActionErrors()

  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: e.notAuthorized }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location,
      type: parsed.data.type,
      description: parsed.data.description?.trim() || null,
      registration_deadline: parsed.data.registration_deadline || null,
    })
    .eq('id', id)

  if (error) {
    console.error('[tournaments] update error:', error)
    return { error: `${e.updateFailed}: ${error.message}` }
  }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function approveTournament(id: string): Promise<{ success?: true; error?: string }> {
  const e = await getActionErrors()

  const role = await getCallerRole()
  if (role !== 'owner') return { error: e.ownerOnly }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    console.error('[tournaments] approve error:', error)
    return { error: `${e.tournamentApproveFailed}: ${error.message}` }
  }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function cancelTournament(id: string): Promise<{ success?: true; error?: string }> {
  const e = await getActionErrors()

  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: e.notAuthorized }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    console.error('[tournaments] cancel error:', error)
    return { error: `${e.tournamentCancelFailed}: ${error.message}` }
  }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function getTournamentsForAdmin(): Promise<Tournament[]> {
  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, date, end_date, location, type, description, registration_deadline, coach_id, status, created_at')
    .order('date', { ascending: true })

  return (data ?? []) as Tournament[]
}
