'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, TrendingUp, Swords, ArrowLeft, UserPlus, UserMinus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  addGroupMember,
  removeGroupMember,
  deleteTrainingGroup,
  type GroupStats,
  type GroupMember,
} from '@/app/actions/training-groups'
import type { SparringRecord } from '@/app/actions/sparring'

interface Props {
  stats: GroupStats
  sparringRecords: SparringRecord[]
  allProfiles: { id: string; full_name: string | null }[]
  isOwner: boolean
}

type Tab = 'members' | 'sparring' | 'fillrate'

export function GroupDetailClient({ stats, sparringRecords, allProfiles, isOwner }: Props) {
  const router = useRouter()
  const { group, members, totalSessions, avgAttendanceRate, topAttendee, sessionFillRates } = stats
  const [tab, setTab] = useState<Tab>('members')
  const [memberList, setMemberList] = useState(members)
  const [addId, setAddId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  const existingIds = new Set(memberList.map(m => m.profile_id))
  const available = allProfiles.filter(p => !existingIds.has(p.id))

  function handleAdd() {
    if (!addId) return
    const profile = allProfiles.find(p => p.id === addId)
    startTransition(async () => {
      const res = await addGroupMember(group.id, addId)
      if (!('error' in res) && profile) {
        setMemberList(prev => [...prev, {
          profile_id: addId,
          full_name: profile.full_name,
          email: null,
          joined_at: new Date().toISOString(),
          attendance_count: 0,
          group_attendance_count: 0,
        }])
        setAddId('')
      }
    })
  }

  function handleRemove(profileId: string) {
    startTransition(async () => {
      const res = await removeGroupMember(group.id, profileId)
      if (!('error' in res)) {
        setMemberList(prev => prev.filter(m => m.profile_id !== profileId))
      }
    })
  }

  async function handleDelete() {
    if (!confirm(`Gruppe "${group.name}" wirklich löschen?`)) return
    setDeleting(true)
    await deleteTrainingGroup(group.id)
    router.push('/admin/gruppen')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/gruppen" className="mb-2 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Alle Gruppen
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
            <h1 className="text-2xl font-black text-foreground">{group.name}</h1>
          </div>
          {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 border border-destructive/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 size={12} /> Löschen
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Mitglieder" value={String(memberList.length)} />
        <Kpi label="Sessions gesamt" value={String(totalSessions)} />
        <Kpi label="Ø Besuchsrate" value={`${avgAttendanceRate}%`} highlight={avgAttendanceRate >= 60} />
        <Kpi label="Top Teilnehmer" value={topAttendee?.full_name?.split(' ')[0] ?? '—'} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-border">
        {([
          { key: 'members', label: 'Mitglieder', Icon: Users },
          { key: 'sparring', label: 'Sparring-Rangliste', Icon: Swords },
          { key: 'fillrate', label: 'Auslastung', Icon: TrendingUp },
        ] as { key: Tab; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
              tab === key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Members */}
      {tab === 'members' && (
        <div className="space-y-4">
          {isOwner && available.length > 0 && (
            <div className="flex gap-2">
              <select
                value={addId}
                onChange={e => setAddId(e.target.value)}
                className="flex-1 border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Mitglied hinzufügen …</option>
                {available.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name ?? p.id}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!addId || isPending}
                className="flex items-center gap-2 bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                <UserPlus size={13} /> Hinzufügen
              </button>
            </div>
          )}

          {memberList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Mitglieder in dieser Gruppe.</p>
          ) : (
            <div className="divide-y divide-border border border-border">
              {memberList
                .slice()
                .sort((a, b) => b.group_attendance_count - a.group_attendance_count)
                .map((m, i) => (
                  <MemberRow
                    key={m.profile_id}
                    rank={i + 1}
                    member={m}
                    totalSessions={totalSessions}
                    isOwner={isOwner}
                    onRemove={() => handleRemove(m.profile_id)}
                    isPending={isPending}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sparring */}
      {tab === 'sparring' && (
        <SparringLeaderboard records={sparringRecords} />
      )}

      {/* Tab: Fill rate */}
      {tab === 'fillrate' && (
        <FillRateChart data={sessionFillRates} />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Kpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-black', highlight ? 'text-primary' : 'text-foreground')}>{value}</p>
    </div>
  )
}

function MemberRow({
  rank, member, totalSessions, isOwner, onRemove, isPending
}: {
  rank: number
  member: GroupMember
  totalSessions: number
  isOwner: boolean
  onRemove: () => void
  isPending: boolean
}) {
  const pct = totalSessions > 0 ? Math.round((member.group_attendance_count / totalSessions) * 100) : 0

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-5 text-right text-xs font-bold text-muted-foreground">{rank}.</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{member.full_name ?? '—'}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{member.group_attendance_count}/{totalSessions} ({pct}%)</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{member.attendance_count} total</span>
      {isOwner && (
        <button onClick={onRemove} disabled={isPending} className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50">
          <UserMinus size={14} />
        </button>
      )}
    </div>
  )
}

function SparringLeaderboard({ records }: { records: SparringRecord[] }) {
  if (!records.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Sparring-Daten für diese Gruppe.</p>
  }
  return (
    <div className="divide-y divide-border border border-border">
      {records.map((r, i) => (
        <div key={r.profile_id} className="flex items-center gap-4 px-4 py-3">
          <span className="w-5 text-right text-xs font-bold text-muted-foreground">{i + 1}.</span>
          <span className="flex-1 text-sm font-medium text-foreground">{r.profile_name ?? '—'}</span>
          <div className="flex gap-4 text-xs">
            <span className="font-bold text-green-500">{r.wins}S</span>
            <span className="text-muted-foreground">{r.draws}U</span>
            <span className="font-bold text-red-500">{r.losses}N</span>
            <span className={cn('font-black', r.win_rate >= 60 ? 'text-primary' : 'text-foreground')}>
              {r.win_rate}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function FillRateChart({ data }: { data: GroupStats['sessionFillRates'] }) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Keine Session-Daten verfügbar.</p>
  }
  return (
    <div className="space-y-2">
      {data.map(s => {
        const pct = s.capacity > 0 ? Math.round((s.booked / s.capacity) * 100) : 0
        return (
          <div key={s.session_id} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{s.label}</span>
            <div className="flex-1">
              <div className="h-4 overflow-hidden rounded bg-muted">
                <div
                  className={cn('h-full transition-all', pct >= 95 ? 'bg-primary' : pct >= 70 ? 'bg-primary/60' : 'bg-primary/30')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="w-20 text-right text-xs text-foreground">
              {s.booked}/{s.capacity} ({pct}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}
