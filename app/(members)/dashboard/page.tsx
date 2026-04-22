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
import { Flame, Target, QrCode, Clock } from 'lucide-react'
import Link from 'next/link'
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">{t.dashboard.title}</h1>
        <TrainingLogButton />
      </div>

      {showBanner && <TrainingLogBanner sessionId={latestAtt.session_id} />}

      {/* ── XP bar (full-width) ── */}
      <div className="mb-4">
        <XpWidget profileId={userId} />
      </div>

      {/* ══════════ BENTO GRID ══════════ */}
      <BentoGrid>

        {/* 1 — Next class (hero action, 2×2) */}
        <BentoTile colSpan={2} rowSpan={2} glowColor="220 38 38" enableStars>
          <NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
        </BentoTile>

        {/* 2 — Hero KPI: total trainings */}
        <BentoTile colSpan={1} glowColor="220 38 38">
          <div className="flex h-full flex-col justify-between p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t.dashboard.trainingsTotal}
            </p>
            <p className="font-mono text-5xl font-black tabular-nums text-foreground">
              {attendanceCount ?? 0}
            </p>
            {/* pace bar vs weekly goal */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Target size={11} />
                  Ø {weeklyAvg.toFixed(1)}&thinsp;/&thinsp;Woche
                </span>
                <span className={onPace ? 'text-emerald-500' : 'text-amber-500'}>
                  {pacePercent}% Ziel
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${onPace ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${pacePercent}%` }}
                />
              </div>
            </div>
          </div>
        </BentoTile>

        {/* 3 — Streak */}
        <BentoTile colSpan={1}>
          <div className="flex h-full flex-col justify-between p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
            <div className="flex items-end gap-2">
              {trainingStats.currentStreak > 0 && (
                <Flame size={32} className="mb-0.5 text-primary" strokeWidth={2.5} />
              )}
              <p className="font-mono text-5xl font-black tabular-nums text-foreground">
                {trainingStats.currentStreak > 0 ? trainingStats.currentStreak : '—'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {trainingStats.currentStreak > 0 ? 'Wochen in Folge' : 'Noch kein Streak'}
            </p>
          </div>
        </BentoTile>

        {/* 4 — Ø Mood */}
        <BentoTile colSpan={1}>
          <div className="flex h-full flex-col justify-between p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ø Stimmung</p>
            <p className="font-mono text-5xl font-black tabular-nums text-foreground">
              {trainingStats.avgMoodLift !== null
                ? `${trainingStats.avgMoodLift > 0 ? '+' : ''}${trainingStats.avgMoodLift}`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">nach dem Training</p>
          </div>
        </BentoTile>

        {/* 5 — Active bookings */}
        <BentoTile colSpan={1}>
          <div className="flex h-full flex-col justify-between p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t.dashboard.activeBookings}
            </p>
            <p className="font-mono text-5xl font-black tabular-nums text-foreground">
              {bookingCount ?? 0}
            </p>
            <Link href="/buchen" className="text-xs font-semibold text-primary hover:underline">
              Mehr buchen →
            </Link>
          </div>
        </BentoTile>

        {/* 6 — Training frequency chart (full width) */}
        {trainingStats.weeklyFrequency.length > 0 && (
          <BentoTile colSpan={4}>
            <TrainingFrequencyChart data={trainingStats.weeklyFrequency} />
          </BentoTile>
        )}

        {/* 7 — Mood trend */}
        {trainingStats.moodTrend.length > 1 && (
          <BentoTile colSpan={2}>
            <MoodTrendChart data={trainingStats.moodTrend} />
          </BentoTile>
        )}

        {/* 8 — Skill radar */}
        {trainingStats.radarAvg && (
          <BentoTile colSpan={2}>
            <SkillRadarChart data={trainingStats.radarAvg} />
          </BentoTile>
        )}

        {/* 9 — Belt progress (full width) */}
        <BentoTile colSpan={4}>
          <BeltProgress
            beltName={beltRank?.name ?? null}
            stripes={beltRank?.stripes ?? 0}
            colorHex={beltRank?.color_hex ?? null}
            readiness={readiness}
            sessionsAttended={attendanceCount ?? 0}
            monthsInGrade={monthsInGrade}
            lang={lang}
          />
        </BentoTile>

        {/* 10 — Motivation + Subscription side-by-side */}
        <BentoTile colSpan={2}>
          <MotivationWidget
            streak={trainingStats.currentStreak}
            totalSessions={trainingStats.totalSessions}
            lastSessionDate={trainingStats.lastSessionDate}
            lastGoal={trainingStats.lastGoal}
          />
        </BentoTile>
        <BentoTile colSpan={2}>
          <MySubscriptionCard />
        </BentoTile>

        {/* 11 — Leaderboard (2 cols) + Training partners (2 cols) */}
        <BentoTile colSpan={2}>
          <LeaderboardWidget entries={leaderboardEntries} lang={lang} />
        </BentoTile>
        <BentoTile colSpan={2}>
          <TrainingPartnersWidget partners={trainingPartners} lang={lang} />
        </BentoTile>

        {/* 12 — Competitions (full width) */}
        <BentoTile colSpan={4}>
          <CompetitionsWidget initial={competitions} />
        </BentoTile>

        {/* 13 — QR code + Opening hours */}
        <BentoTile colSpan={2} glowColor="120 120 220">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <QrCode size={14} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Check-In QR</span>
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <MemberQRCode profileId={userId} />
            </div>
          </div>
        </BentoTile>
        <BentoTile colSpan={2} glowColor="80 180 120">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Clock size={14} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</span>
            </div>
            <div className="p-4">
              <OpeningHoursWidget hours={gym.opening_hours} />
            </div>
          </div>
        </BentoTile>

      </BentoGrid>
    </div>
  )
}
