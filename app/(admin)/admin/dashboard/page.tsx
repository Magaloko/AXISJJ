// app/(admin)/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboard } from '@/app/actions/admin'
import { getOwnerInsights } from '@/app/actions/owner-insights'
import { getCoachInsights } from '@/app/actions/coach-insights'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { PromotionsWidget } from '@/components/admin/PromotionsWidget'
import { LeadsMiniKanban } from '@/components/admin/LeadsMiniKanban'
import { UtilizationChart } from '@/components/admin/UtilizationChart'
import { TopClassesChart } from '@/components/admin/TopClassesChart'
import { RevenueWidget } from '@/components/admin/RevenueWidget'
import { CoachTodaySchedule } from '@/components/admin/CoachTodaySchedule'
import { MyStudentsWidget } from '@/components/admin/MyStudentsWidget'
import { InactiveMembersWidget } from '@/components/admin/InactiveMembersWidget'
import { BirthdaysWidget } from '@/components/admin/BirthdaysWidget'
import { getUpcomingBirthdays } from '@/app/actions/birthdays'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [data, ownerInsights, coachInsights, birthdays] = await Promise.all([
    getAdminDashboard(),
    getOwnerInsights().catch(() => null),
    getCoachInsights().catch(() => null),
    getUpcomingBirthdays(14).catch(() => []),
  ])

  if (data.error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }

  const role = data.role

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

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
        {upcomingSession && (
          <div className="mb-6 border border-border bg-card p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nächste Klasse
            </p>
            <p className="text-base font-black text-foreground">
              {upcomingSession.class_types?.name ?? 'Session'}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {formatTime(upcomingSession.starts_at)} – {formatTime(upcomingSession.ends_at)}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{upcomingSession.confirmedCount} Buchungen</span>
                <span>{upcomingSession.capacity} Plätze</span>
              </div>
              <div className="h-1.5 w-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (upcomingSession.confirmedCount / upcomingSession.capacity) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Today's schedule */}
        <div className="mb-6 border border-border bg-card p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Heutiger Plan
          </p>
          {(data.todaySessions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
          ) : (
            <ul className="space-y-2">
              {data.todaySessions?.map(s => (
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

  // ── Owner view ──────────────────────────────────────────────────────────────
  const insights = ownerInsights && !ownerInsights.error ? ownerInsights : null

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

      {/* Stat strip: 4 primary KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Mitglieder" value={data.activeMembers ?? 0} />
        <AdminStatCard label="Neue Leads" value={data.newLeads ?? 0} highlight />
        <AdminStatCard label="Check-Ins heute" value={data.checkinsToday} />
        <AdminStatCard
          label="Umsatz (Monat)"
          value={insights ? `${insights.estimatedMonthlyRevenue.toLocaleString('de-DE')} €` : '—'}
        />
      </div>

      {/* Secondary metrics row */}
      {insights && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <AdminStatCard
            label="Lead-Konversion"
            value={`${insights.leadConversionRate} %`}
          />
          <AdminStatCard
            label="Umsatz vs. Vormonat"
            value={`${insights.revenueVsLastMonthPct > 0 ? '+' : ''}${insights.revenueVsLastMonthPct} %`}
          />
          <AdminStatCard
            label="Ø Auslastung (30T)"
            value={`${insights.avgClassFillRate} %`}
          />
        </div>
      )}

      {/* Next class */}
      {upcomingSession && (
        <div className="mb-6 border border-border bg-card p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Nächste Klasse
          </p>
          <p className="text-base font-black text-foreground">
            {upcomingSession.class_types?.name ?? 'Session'}
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatTime(upcomingSession.starts_at)} – {formatTime(upcomingSession.ends_at)}
          </p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{upcomingSession.confirmedCount} Buchungen</span>
              <span>{upcomingSession.capacity} Plätze</span>
            </div>
            <div className="h-1.5 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (upcomingSession.confirmedCount / upcomingSession.capacity) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Promotions + Birthdays */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {data.promotionsReady && <PromotionsWidget promotions={data.promotionsReady} />}
        {birthdays.length > 0 && <BirthdaysWidget birthdays={birthdays} />}
      </div>

      {/* Today's schedule */}
      <div className="mb-6 border border-border bg-card p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Heutiger Plan
        </p>
        {(data.todaySessions?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
        ) : (
          <ul className="space-y-2">
            {data.todaySessions?.map(s => (
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

      {/* Charts row */}
      {insights && (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <UtilizationChart data={insights.utilizationTrend} />
            <TopClassesChart data={insights.topClasses} />
          </div>

          {/* Inactive members + Leads kanban */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <InactiveMembersWidget members={insights.inactiveMembers} />
            {data.leadsByStatus && <LeadsMiniKanban data={data.leadsByStatus} />}
          </div>

          {/* Revenue breakdown */}
          <RevenueWidget
            estimatedMonthlyRevenue={insights.estimatedMonthlyRevenue}
            activeMembers={insights.activeMembers}
            breakdown={insights.revenueBreakdown}
          />
        </>
      )}
    </div>
  )
}
