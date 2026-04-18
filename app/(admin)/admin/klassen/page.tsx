// app/(admin)/admin/klassen/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek } from 'date-fns'
import { SessionCalendar } from '@/components/admin/SessionCalendar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Klassen | Admin' }

export default async function KlassenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const [sessionsResult, classTypesResult] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`
        id, starts_at, ends_at, cancelled, location, capacity, class_type_id,
        class_types(name),
        bookings(id, status)
      `)
      .gte('starts_at', weekStart.toISOString())
      .lte('starts_at', weekEnd.toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('class_types')
      .select('id, name')
      .order('name', { ascending: true }),
  ])

  const rawSessions = sessionsResult.data ?? []
  const sessions = rawSessions.map((s: Record<string, unknown>) => {
    const bookingsArr = Array.isArray(s.bookings) ? s.bookings as { status: string }[] : []
    const confirmedCount = bookingsArr.filter(b => b.status === 'confirmed').length
    const rawCt = s.class_types
    const classType = Array.isArray(rawCt) ? rawCt[0] : rawCt
    return {
      id: s.id as string,
      starts_at: s.starts_at as string,
      ends_at: s.ends_at as string,
      cancelled: s.cancelled as boolean,
      location: s.location as string | null,
      capacity: s.capacity as number,
      class_type_id: s.class_type_id as string,
      class_types: classType ? { name: (classType as { name: string }).name } : null,
      confirmedCount,
    }
  })

  const classTypes = (classTypesResult.data ?? []).map(ct => ({
    id: ct.id as string,
    name: ct.name as string,
  }))

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Klassen</h1>
      <SessionCalendar initialSessions={sessions} classTypes={classTypes} />
    </div>
  )
}
