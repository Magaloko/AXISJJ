// app/(admin)/admin/gruppen/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTrainingGroups, getCoachFillStats } from '@/app/actions/training-groups'
import { Users, Plus, BarChart2, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gruppen | Admin' }

export default async function GruppenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['coach', 'owner', 'developer'].includes(profile.role)) redirect('/admin/dashboard')

  const [groups, fillStats] = await Promise.all([
    getTrainingGroups(),
    getCoachFillStats(),
  ])

  const isOwner = ['owner', 'developer'].includes(profile.role)

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Gruppen</h1>
          <p className="text-sm text-muted-foreground">{groups.length} Gruppe{groups.length !== 1 ? 'n' : ''}</p>
        </div>
        {isOwner && (
          <Link
            href="/admin/gruppen/neu"
            className="flex items-center gap-2 bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground"
          >
            <Plus size={14} /> Neue Gruppe
          </Link>
        )}
      </div>

      {/* Groups grid */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="mb-4 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Noch keine Gruppen angelegt.</p>
          {isOwner && (
            <Link href="/admin/gruppen/neu" className="mt-4 text-xs font-bold uppercase tracking-wider text-primary underline">
              Erste Gruppe erstellen →
            </Link>
          )}
        </div>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(g => (
            <Link
              key={g.id}
              href={`/admin/gruppen/${g.id}`}
              className="group flex flex-col gap-3 border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                <span className="text-xs font-bold text-muted-foreground">
                  {g.member_count} Mitglied{g.member_count !== 1 ? 'er' : ''}
                </span>
              </div>
              <div>
                <p className="text-base font-black text-foreground group-hover:text-primary">{g.name}</p>
                {g.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{g.description}</p>}
              </div>
              {g.coach_name && (
                <p className="text-xs text-muted-foreground">Coach: {g.coach_name}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Coach Fill-Rate Stats */}
      {fillStats.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Klassen-Auslastung (letzte 90 Tage)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trainer / Veranstalter</th>
                  <th className="py-2 pr-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sessions</th>
                  <th className="py-2 pr-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ø Auslastung</th>
                  <th className="py-2 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ausgebucht</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fillStats.map(s => (
                  <tr key={s.coach_id}>
                    <td className="py-3 pr-4 font-medium text-foreground">{s.coach_name}</td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">{s.total_sessions}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="ml-auto flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${s.avg_fill_pct}%` }}
                          />
                        </div>
                        <span className={s.avg_fill_pct >= 80 ? 'font-bold text-primary' : 'text-foreground'}>
                          {s.avg_fill_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={s.fully_booked > 0 ? 'font-bold text-primary' : 'text-muted-foreground'}>
                        {s.fully_booked}×
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
