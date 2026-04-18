// components/admin/MemberTable.tsx
'use client'

import { useState } from 'react'

interface Belt { id: string; name: string; color_hex: string | null }
interface Member {
  id: string
  full_name: string | null
  created_at: string
  lastAttendance: string | null
  belt: { name: string; stripes: number; color_hex: string | null } | null
}

interface Props {
  members: Member[]
  belts: Belt[]
}

export function MemberTable({ members, belts }: Props) {
  const [search, setSearch] = useState('')
  const [beltFilter, setBeltFilter] = useState('')
  const [selected, setSelected] = useState<Member | null>(null)

  const filtered = members.filter(m => {
    const matchesSearch = !search || (m.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesBelt = !beltFilter || m.belt?.name === beltFilter
    return matchesSearch && matchesBelt
  })

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Name suchen ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={beltFilter}
          onChange={e => setBeltFilter(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">Alle Gürtel</option>
          {belts.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</th>
              <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Gürtel</th>
              <th className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Mitglied seit</th>
              <th className="py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Letztes Training</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr
                key={member.id}
                onClick={() => setSelected(member)}
                className="cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 pr-4 font-semibold text-foreground">
                  {member.full_name ?? '—'}
                </td>
                <td className="py-3 pr-4">
                  {member.belt ? (
                    <span className="flex items-center gap-2">
                      {member.belt.color_hex && (
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-border/50"
                          style={{ backgroundColor: member.belt.color_hex }}
                        />
                      )}
                      <span className="font-medium text-foreground">{member.belt.name}</span>
                      {member.belt.stripes > 0 && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {'|'.repeat(member.belt.stripes)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                  {formatDate(member.created_at)}
                </td>
                <td className="py-3 text-muted-foreground hidden md:table-cell">
                  {formatDate(member.lastAttendance)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  Keine Mitglieder gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Member detail panel (read-only modal) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm border border-border bg-card p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-base font-black text-foreground">{selected.full_name ?? '—'}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Detail schließen"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gürtel</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {selected.belt ? `${selected.belt.name} · ${selected.belt.stripes} Stripe(s)` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mitglied seit</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{formatDate(selected.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Letztes Training</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{formatDate(selected.lastAttendance)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
