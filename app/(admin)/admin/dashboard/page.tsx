// app/(admin)/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboard } from '@/app/actions/admin'
import { getCoachInsights } from '@/app/actions/coach-insights'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { PromotionsWidget } from '@/components/admin/PromotionsWidget'
import { CoachTodaySchedule } from '@/components/admin/CoachTodaySchedule'
import { MyStudentsWidget } from '@/components/admin/MyStudentsWidget'
import { MissingCheckinsWidget } from '@/components/admin/MissingCheckinsWidget'
import type { TodaySession } from '@/app/actions/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

interface NextClassCardProps {
  session: {
    class_types: { name: string } | null
    starts_at: string
    ends_at: string
    confirmedCount: number
    capacity: number
  }
  formatTime: (iso: string) => string
}

function NextClassCard({ session, formatTime }: NextClassCardProps) {
  return (
    <div className="mb-6 border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Nächste Klasse
      </p>
      <p className="text-base font-black text-foreground">
        {session.class_types?.name ?? 'Session'}
      </p>
      <p className="mt-1 font-mono text-sm text-muted-foreground">
        {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
      </p>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{session.confirmedCount} Buchungen</span>
          <span>{session.capacity} Plätze</span>
        </div>
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, session.capacity > 0 ? (session.confirmedCount / session.capacity) * 100 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

interface TodayScheduleCardProps {
  sessions: TodaySession[]
  formatTime: (iso: string) => string
}

function TodayScheduleCard({ sessions, formatTime }: TodayScheduleCardProps) {
  return (
    <div className="mb-6 border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Heutiger Plan
      </p>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map(s => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{s.class_types?.name ?? 'Session'}</span>
              <span className="font-mono text-muted-foreground">
                {formatTime(s.starts_at)} · {s.confirmedCount}/{s.capacity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [data, coachInsights] = await Promise.all([
    getAdminDashboard(),
    getCoachInsights().catch(() => null),
  ])

  if (data.error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }

  const role = data.role

  const now = new Date()
  const upcomingSession = data.todaySessions?.find(s => new Date(s.starts_at) > now)

  // ── Coach view ──────────────────────────────────────────────────────────────
  if (role === 'coach') {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

        {/* Stat strip */}
        {coachInsights && !coachInsights.error && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminStatCard label="Klassen heute" value={coachInsights.sessionsTodayCount} highlight />
            <AdminStatCard label="Diese Woche" value={coachInsights.sessionsWeekCount} />
            <AdminStatCard label="Meine Schüler (30T)" value={coachInsights.studentsLast30d} />
            <AdminStatCard label="Check-Ins heute" value={coachInsights.checkinsTodayCount} />
          </div>
        )}

        {/* Next class */}
        {upcomingSession && <NextClassCard session={upcomingSession} formatTime={formatTime} />}

        {/* Today's schedule */}
        <TodayScheduleCard sessions={data.todaySessions ?? []} formatTime={formatTime} />

        {/* Coach schedule + students */}
        {coachInsights && !coachInsights.error && (
          <div className="grid gap-6 lg:grid-cols-2">
            <CoachTodaySchedule sessions={coachInsights.todaySessions} />
            <MyStudentsWidget students={coachInsights.students} />
          </div>
        )}
      </div>
    )
  }

  // ── Owner view (coach layout with gym-wide data) ──────────────────────────
  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

      {/* Stat strip: 4 gym-wide KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Klassen heute" value={data.todaySessions?.length ?? 0} highlight />
        <AdminStatCard label="Buchungen heute" value={data.bookingsToday} />
        <AdminStatCard label="Alle Mitglieder" value={data.activeMembers ?? 0} />
        <AdminStatCard label="Check-Ins heute" value={data.checkinsToday} />
      </div>

      {/* Next class */}
      {upcomingSession && (
        <NextClassCard session={upcomingSession} formatTime={formatTime} />
      )}

      {/* Today's attendance summary + schedule, side-by-side on wide screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayScheduleCard sessions={data.todaySessions ?? []} formatTime={formatTime} />
        {data.todayAttendance && data.todayAttendance.booked > 0 && (
          <MissingCheckinsWidget summary={data.todayAttendance} />
        )}
      </div>

      {/* Promotions ready */}
      {data.promotionsReady && data.promotionsReady.length > 0 && (
        <div className="mt-6">
          <PromotionsWidget promotions={data.promotionsReady} />
        </div>
      )}
    </div>
  )
}
