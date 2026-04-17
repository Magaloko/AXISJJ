// app/(members)/buchen/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ClassSlot } from '@/components/members/ClassSlot'
import { getDayLabel, formatDateShort, getNextSevenDays, startOfDay, endOfDay, addDays } from '@/lib/utils/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Klassen buchen' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string; profile_id: string; status: string; waitlist_position: number | null }

interface SessionRow {
  id: string
  starts_at: string
  ends_at: string
  capacity: number
  location: string
  class_types: ClassType[] | ClassType | null | undefined
  bookings: BookingRow[] | null
}

export default async function BuchenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const now = new Date()
  const weekStart = startOfDay(now)
  const weekEnd = endOfDay(addDays(now, 6))

  const { data: rawSessions } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, capacity, location,
      class_types(name, gi, level),
      bookings(id, profile_id, status, waitlist_position)
    `)
    .eq('cancelled', false)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true })

  const sessions = (rawSessions ?? []) as SessionRow[]

  const days = getNextSevenDays()

  const sessionsByDay = days.map(day => {
    const dayStr = day.toISOString().slice(0, 10)
    const daySessions = sessions.filter(s => s.starts_at.startsWith(dayStr))
    return { day, sessions: daySessions }
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Klassen buchen</h1>

      <div className="space-y-6">
        {sessionsByDay.map(({ day, sessions: daySessions }) => (
          <div key={day.toISOString()}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {getDayLabel(day)}
              </h2>
              <span className="text-xs text-gray-600">{formatDateShort(day.toISOString())}</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            {daySessions.length === 0 ? (
              <p className="text-xs text-gray-700">Keine Klassen an diesem Tag</p>
            ) : (
              <div className="border border-white/5 bg-[#111111] px-4">
                {daySessions.map(session => {
                  const bookings = session.bookings ?? []
                  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
                  const userBookingRaw = bookings.find(b => b.profile_id === userId)
                  const userBooking = userBookingRaw && userBookingRaw.status !== 'cancelled'
                    ? { id: userBookingRaw.id, status: userBookingRaw.status as 'confirmed' | 'waitlisted' | 'cancelled' }
                    : null

                  const rawClassTypes = session.class_types
                  const classType: ClassType | null = Array.isArray(rawClassTypes)
                    ? (rawClassTypes[0] ?? null)
                    : (rawClassTypes ?? null)

                  const typedSession = {
                    id: session.id,
                    starts_at: session.starts_at,
                    ends_at: session.ends_at,
                    capacity: session.capacity,
                    location: session.location,
                    class_types: classType,
                  }

                  return (
                    <ClassSlot
                      key={session.id}
                      session={typedSession}
                      userBooking={userBooking}
                      confirmedCount={confirmedCount}
                    />
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
