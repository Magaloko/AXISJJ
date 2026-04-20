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
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [data, ownerInsights, coachInsights] = await Promise.all([
    getAdminDashboard(),
    getOwnerInsights().catch(() => null),
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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const now = new Date()
  const upcomingSession = data.todaySessions?.find(s => new Date(s.starts_at) > now)

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

      {/* Stat cards */}
      {role === 'coach' && coachInsights && !coachInsights.error ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Meine Klassen heute" value={coachInsights.sessionsTodayCount} highlight />
          <AdminStatCard label="Diese Woche" value={coachInsights.sessionsWeekCount} />
          <AdminStatCard label="Meine Mitglieder (30T)" value={coachInsights.studentsLast30d} />
          <AdminStatCard label="Check-Ins heute" value={coachInsights.checkinsTodayCount} />
        </div>
      ) : (
        <div className={`mb-6 grid gap-4 ${role === 'owner' ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2'}`}>
          {role === 'owner' && <AdminStatCard label="Mitglieder" value={data.activeMembers ?? 0} />}
          {role === 'owner' && <AdminStatCard label="Neue Leads" value={data.newLeads ?? 0} highlight />}
          <AdminStatCard label="Check-Ins heute" value={data.checkinsToday} />
          <AdminStatCard label="Buchungen heute" value={data.bookingsToday} />
          {role === 'owner' && <AdminStatCard label="Promotions bereit" value={data.promotionsReady?.length ?? 0} />}
        </div>
      )}

      {/* Coach-specific widgets */}
      {role === 'coach' && coachInsights && !coachInsights.error && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <CoachTodaySchedule sessions={coachInsights.todaySessions} />
          <MyStudentsWidget students={coachInsights.students} />
        </div>
      )}

      {/* Upcoming class card + PromotionsWidget (owner) / upcoming alone (coach) */}
      {role === 'owner' ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {upcomingSession && (
            <div className="border border-border bg-card p-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Nächste Klasse
              </p>
              <p className="text-base font-black text-foreground">
                {upcomingSession.class_types?.name ?? 'Session'}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {formatTime(upcomingSession.starts_at)} – {formatTime(upcomingSession.ends_at)}
              </p>
              {/* Capacity bar */}
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
          {data.promotionsReady && <PromotionsWidget promotions={data.promotionsReady} />}
        </div>
      ) : (
        upcomingSession && (
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
            {/* Capacity bar */}
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
        )
      )}

      {/* Today's schedule */}
      <div className="border border-border bg-card p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Heutiger Plan
        </p>
        {(data.todaySessions?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
        ) : (
          <ul className="space-y-2">
            {data.todaySessions?.map(s => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {s.class_types?.name ?? 'Session'}
                </span>
                <span className="font-mono text-muted-foreground">
                  {formatTime(s.starts_at)} · {s.confirmedCount}/{s.capacity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Owner only: Business insights */}
      {role === 'owner' && ownerInsights && !ownerInsights.error && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UtilizationChart data={ownerInsights.utilizationTrend} />
            </div>
            <RevenueWidget
              estimatedMonthlyRevenue={ownerInsights.estimatedMonthlyRevenue}
              activeMembers={ownerInsights.activeMembers}
              breakdown={ownerInsights.revenueBreakdown}
            />
          </div>

          <div className="mt-6">
            <TopClassesChart data={ownerInsights.topClasses} />
          </div>
        </>
      )}

      {/* Owner only: LeadsMiniKanban */}
      {role === 'owner' && data.leadsByStatus && (
        <div className="mt-6">
          <LeadsMiniKanban data={data.leadsByStatus} />
        </div>
      )}
    </div>
  )
}
