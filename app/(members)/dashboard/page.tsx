// app/(members)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // user is non-null here: layout redirects unauthenticated requests before rendering pages
  const userId = (user as NonNullable<typeof user>).id

  const now = new Date().toISOString()

  // Next upcoming session with user's confirmed booking
  const { data: nextSessions } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, location,
      class_types(name, gi, level),
      bookings!inner(id, profile_id, status)
    `)
    .eq('bookings.profile_id', userId)
    .eq('bookings.status', 'confirmed')
    .eq('cancelled', false)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(1)

  const raw = nextSessions?.[0] ?? null
  const rawBookings = raw?.bookings as BookingRow[] | BookingRow | null | undefined
  const bookingId = (Array.isArray(rawBookings) ? rawBookings[0] : rawBookings)?.id ?? null

  const rawClassTypes = raw?.class_types as ClassType[] | ClassType | null | undefined
  const classType: ClassType | null = Array.isArray(rawClassTypes)
    ? (rawClassTypes[0] ?? null)
    : (rawClassTypes ?? null)

  const nextSession = raw
    ? { id: raw.id, starts_at: raw.starts_at, ends_at: raw.ends_at, location: raw.location, class_types: classType }
    : null

  // Total sessions attended
  const { count: attendanceCount } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // Total confirmed upcoming bookings
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('status', 'confirmed')

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Next class — spans 2 columns */}
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession} bookingId={bookingId} />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Trainings gesamt</p>
            <p className="mt-2 text-4xl font-black text-white">{attendanceCount ?? 0}</p>
          </div>
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Aktive Buchungen</p>
            <p className="mt-2 text-4xl font-black text-white">{bookingCount ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
