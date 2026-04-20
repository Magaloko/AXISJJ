// app/(admin)/admin/klassen/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { subMonths, addMonths } from 'date-fns'
import { SessionCalendar } from '@/components/admin/SessionCalendar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Training | Admin' }

export default async function KlassenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch a wide range (±2 months around today) so Day/Week/Month/Quarter views
  // all work without re-fetching. Client filters this down per view.
  const rangeStart = subMonths(new Date(), 2)
  const rangeEnd = addMonths(new Date(), 2)

  const [sessionsResult, classTypesResult, coachesResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`
        id, starts_at, ends_at, cancelled, location, capacity, class_type_id, coach_id,
        class_types(name),
        bookings(id, status),
        profiles!class_sessions_coach_id_fkey(full_name)
      `)
      .gte('starts_at', rangeStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('class_types')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['coach', 'owner'])
      .order('full_name', { ascending: true }),
  ])

  const sessions = (sessionsResult.data ?? []).map((s) => {
    const bookingsArr = Array.isArray(s.bookings) ? s.bookings : []
    const confirmedCount = bookingsArr.filter(b => b.status === 'confirmed').length
    const classType = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
    const coachProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    return {
      id: s.id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      cancelled: s.cancelled,
      location: s.location,
      capacity: s.capacity,
      class_type_id: s.class_type_id,
      coach_id: s.coach_id ?? null,
      coach_name: coachProfile?.full_name ?? null,
      class_types: classType ? { name: classType.name } : null,
      confirmedCount,
    }
  })

  const classTypes = (classTypesResult.data ?? []).map(ct => ({
    id: ct.id,
    name: ct.name,
  }))

  const coaches = (coachesResult.data ?? []).map(c => ({
    id: c.id,
    name: c.full_name,
  }))

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Training</h1>
      <SessionCalendar initialSessions={sessions} classTypes={classTypes} coaches={coaches} />
    </div>
  )
}
