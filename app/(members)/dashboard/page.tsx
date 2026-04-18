// app/(members)/dashboard/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import { BeltProgress } from '@/components/members/BeltProgress'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import { translations } from '@/lib/i18n'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { MemberQRCode } from '@/components/members/MemberQRCode'
import { OpeningHoursWidget } from '@/components/members/OpeningHoursWidget'
import { getGymSettings } from '@/lib/gym-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string }
interface BeltRankRow {
  name: string; stripes: number; color_hex: string | null
  min_sessions: number | null; min_time_months: number | null
}

export default async function DashboardPage() {
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const now = new Date().toISOString()

  const gym = await getGymSettings()

  const [
    { data: nextSessions },
    { count: attendanceCount },
    { count: bookingCount },
    { data: rankHistory },
  ] = await Promise.all([
    supabase
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
      .limit(1),
    supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('status', 'confirmed'),
    supabase
      .from('profile_ranks')
      .select('promoted_at, belt_ranks(name, stripes, color_hex, min_sessions, min_time_months)')
      .eq('profile_id', userId)
      .order('promoted_at', { ascending: false })
      .limit(1),
  ])

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

  const latestRankRow = rankHistory?.[0] ?? null
  const rawBeltRank = latestRankRow?.belt_ranks
  const beltRank: BeltRankRow | null = Array.isArray(rawBeltRank)
    ? (rawBeltRank[0] ?? null)
    : (rawBeltRank as BeltRankRow | null) ?? null

  const monthsInGrade = latestRankRow?.promoted_at
    ? differenceInMonths(new Date(), new Date(latestRankRow.promoted_at))
    : 0

  const readiness = calcReadiness(
    attendanceCount ?? 0,
    beltRank?.min_sessions ?? null,
    monthsInGrade,
    beltRank?.min_time_months ?? null
  )

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">{t.dashboard.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
        </div>

        <div className="space-y-4">
          <div className="border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.trainingsTotal}</p>
            <p className="mt-2 text-4xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{attendanceCount ?? 0}</p>
          </div>
          <div className="border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.activeBookings}</p>
            <p className="mt-2 text-4xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{bookingCount ?? 0}</p>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <BeltProgress
            beltName={beltRank?.name ?? null}
            stripes={beltRank?.stripes ?? 0}
            colorHex={beltRank?.color_hex ?? null}
            readiness={readiness}
            sessionsAttended={attendanceCount ?? 0}
            monthsInGrade={monthsInGrade}
            lang={lang}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <MemberQRCode profileId={userId} />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <OpeningHoursWidget hours={gym.opening_hours} />
        </div>
      </div>
    </div>
  )
}
