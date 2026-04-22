import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import { BeltProgress } from '@/components/members/BeltProgress'
import { MemberQRCode } from '@/components/members/MemberQRCode'
import { OpeningHoursWidget } from '@/components/members/OpeningHoursWidget'
import { TrainingLogBanner } from '@/components/members/TrainingLogBanner'
import { TrainingFrequencyChart } from '@/components/members/TrainingFrequencyChart'
import { MoodTrendChart } from '@/components/members/MoodTrendChart'
import { SkillRadarChart } from '@/components/members/SkillRadarChart'
import { MotivationWidget } from '@/components/members/MotivationWidget'
import { TrainingLogButton } from '@/components/members/TrainingLogButton'
import { CompetitionsWidget } from '@/components/members/CompetitionsWidget'
import { LeaderboardWidget } from '@/components/members/LeaderboardWidget'
import { TrainingPartnersWidget } from '@/components/members/TrainingPartnersWidget'
import { MySubscriptionCard } from '@/components/members/MySubscriptionCard'
import { XpWidget } from '@/components/members/XpWidget'
import { BentoGrid, BentoTile } from '@/components/ui/MagicBento'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import { translations } from '@/lib/i18n'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { getGymSettings } from '@/lib/gym-settings'
import { getTrainingStats } from '@/app/actions/training-log'
import { getLeaderboard } from '@/app/actions/leaderboard'
import { getTrainingPartners } from '@/app/actions/training-partners'
import { getMyCompetitions } from '@/app/actions/competitions'
import { getEnabledModules } from '@/lib/dashboard-modules'
import { Card, CardContent } from '@/components/ui/card'
import { Flame } from 'lucide-react'
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
  const [gym, modules] = await Promise.all([getGymSettings(), getEnabledModules()])

  const [
    { data: nextSessions },
    { count: attendanceCount },
    { count: bookingCount },
    { data: rankHistory },
    { data: latestAttendance },
    { data: latestLog },
    trainingStats,
    leaderboardEntries,
    trainingPartners,
    competitions,
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`id, starts_at, ends_at, location, class_types(name, gi, level), bookings!inner(id, profile_id, status)`)
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
    supabase
      .from('attendances')
      .select('id, session_id, checked_in_at')
      .eq('profile_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(1),
    supabase
      .from('training_logs')
      .select('id, session_id')
      .eq('profile_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1),
    getTrainingStats(),
    getLeaderboard(),
    getTrainingPartners(),
    getMyCompetitions(),
  ])

  const latestAtt = latestAttendance?.[0] ?? null
  const latestLogEntry = latestLog?.[0] ?? null
  const showBanner = latestAtt !== null &&
    (latestLogEntry === null || latestLogEntry.session_id !== latestAtt.session_id)

  const raw = nextSessions?.[0] ?? null
  const rawBookings = raw?.bookings as BookingRow[] | BookingRow | null | undefined
  const bookingId = (Array.isArray(rawBookings) ? rawBookings[0] : rawBookings)?.id ?? null
  const rawCT = raw?.class_types as ClassType[] | ClassType | null | undefined
  const classType: ClassType | null = Array.isArray(rawCT) ? (rawCT[0] ?? null) : (rawCT ?? null)
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
    beltRank?.min_time_months ?? null,
  )

  /* weekly goal pace — simple heuristic: 3 sessions/week target */
  const WEEKLY_GOAL = 3
  const weeklyAvg = trainingStats.weeklyFrequency.length
    ? trainingStats.weeklyFrequency.reduce((s, w) => s + w.count, 0) / trainingStats.weeklyFrequency.length
    : 0
  const pacePercent = Math.min(Math.round((weeklyAvg / WEEKLY_GOAL) * 100), 100)
  const onPace = weeklyAvg >= WEEKLY_GOAL * 0.8

  const m = modules // shorthand: m.has('key') controls visibility

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">{t.dashboard.title}</h1>
        <TrainingLogButton />
      </div>

      {showBanner && <TrainingLogBanner sessionId={latestAtt.session_id} />}

      {m.has('xp') && (
        <div className="mb-6">
          <XpWidget profileId={userId} />
        </div>
      )}

      {m.has('training_stats') && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.trainingsTotal}</p>
              <p className="mt-1 font-mono text-3xl font-black text-foreground">{attendanceCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-3xl font-black text-foreground">
                {trainingStats.currentStreak > 0 ? (
                  <>
                    <Flame size={24} className="text-primary" strokeWidth={2.5} />
                    {trainingStats.currentStreak}
                  </>
                ) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ø Stimmung</p>
              <p className="mt-1 font-mono text-3xl font-black text-foreground">
                {trainingStats.avgMoodLift !== null
                  ? `${trainingStats.avgMoodLift > 0 ? '+' : ''}${trainingStats.avgMoodLift}`
                  : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.activeBookings}</p>
              <p className="mt-1 font-mono text-3xl font-black text-foreground">{bookingCount ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {m.has('next_class') && (
          <div className="sm:col-span-2">
            <NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
          </div>
        )}
        {m.has('motivation') && (
          <div>
            <MotivationWidget
              streak={trainingStats.currentStreak}
              totalSessions={trainingStats.totalSessions}
              lastSessionDate={trainingStats.lastSessionDate}
              lastGoal={trainingStats.lastGoal}
            />
          </div>
        )}

        {m.has('frequency_chart') && trainingStats.weeklyFrequency.length > 0 && (
          <div className="sm:col-span-2">
            <TrainingFrequencyChart data={trainingStats.weeklyFrequency} />
          </div>
        )}
        {m.has('mood_chart') && trainingStats.moodTrend.length > 1 && (
          <div>
            <MoodTrendChart data={trainingStats.moodTrend} />
          </div>
        )}
        {m.has('skill_radar') && trainingStats.radarAvg && (
          <div>
            <SkillRadarChart data={trainingStats.radarAvg} />
          </div>
        )}

        {m.has('belt_progress') && (
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
        )}
        {m.has('subscription') && (
          <div>
            <MySubscriptionCard />
          </div>
        )}
        {m.has('leaderboard') && (
          <div className="lg:col-span-2">
            <LeaderboardWidget entries={leaderboardEntries} lang={lang} />
          </div>
        )}
        {m.has('training_partners') && (
          <div>
            <TrainingPartnersWidget partners={trainingPartners} lang={lang} />
          </div>
        )}
        {m.has('competitions') && (
          <div className="sm:col-span-2 lg:col-span-3">
            <CompetitionsWidget initial={competitions} />
          </div>
        )}
        {m.has('qr_code') && (
          <div className="sm:col-span-2 lg:col-span-3">
            <MemberQRCode profileId={userId} />
          </div>
        )}
        {m.has('opening_hours') && (
          <div className="sm:col-span-2 lg:col-span-3">
            <OpeningHoursWidget hours={gym.opening_hours} />
          </div>
        )}
      </div>
    </div>
  )
}
