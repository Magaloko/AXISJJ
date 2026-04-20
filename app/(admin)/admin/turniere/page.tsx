import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTournamentsForAdmin } from '@/app/actions/tournaments'
import { TournamentList } from '@/components/admin/TournamentList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Turniere | Admin' }

export default async function AdminTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') redirect('/dashboard')

  const tournaments = await getTournamentsForAdmin()

  return <TournamentList tournaments={tournaments} role={role as 'coach' | 'owner'} />
}
