import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberTournamentList } from '@/components/members/MemberTournamentList'
import { getMyRegistrations } from '@/app/actions/tournament-registrations'
import type { Tournament } from '@/app/actions/tournaments'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Turniere' }

export default async function MemberTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, date, end_date, location, type, description, registration_deadline, coach_id, status, created_at')
    .eq('status', 'approved')
    .gte('date', today)
    .order('date', { ascending: true })

  const tournaments = (data ?? []) as Tournament[]
  const myRegistrations = await getMyRegistrations()

  return <MemberTournamentList tournaments={tournaments} myRegistrations={myRegistrations} />
}
