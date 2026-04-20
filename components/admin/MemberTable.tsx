// components/admin/MemberTable.tsx
'use client'

import { useState } from 'react'
import { MemberEditPanel, type MemberDetail } from './MemberEditPanel'

interface Belt { id: string; name: string; color_hex: string | null }
interface Member {
  id: string
  full_name: string | null
  created_at: string
  lastAttendance: string | null
  phone: string | null
  date_of_birth: string | null
  role: 'member' | 'coach' | 'owner'
  belt: { name: string; stripes: number; color_hex: string | null } | null
}

interface Props {
  members: Member[]
  belts: Belt[]
  viewerRole: 'coach' | 'owner'
}

export function MemberTable({ members, belts, viewerRole }: Props) {
  const [search, setSearch] = useState('')
  const [beltFilter, setBeltFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'coach' | 'owner'>('all')
  const [selected, setSelected] = useState<MemberDetail | null>(null)

  const filtered = members.filter(m => {
    const matchesSearch = !search || (m.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesBelt = !beltFilter || m.belt?.name === beltFilter
    const matchesRole = roleFilter === 'all' || m.role === roleFilter
    return matchesSearch && matchesBelt && matchesRole
  })

  const counts = {
    all: members.length,
    member: members.filter(m => m.role === 'member').length,
    coach: members.filter(m => m.role === 'coach').length,
    owner: members.filter(m => m.role === 'owner').length,
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Role tabs */}
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {([
          { key: 'all',    label: 'Alle' },
          { key: 'member', label: 'Mitglieder' },
          { key: 'coach',  label: 'Coaches' },
          { key: 'owner',  label: 'Owner' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setRoleFilter(t.key)}
            className={`shrink-0 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              roleFilter === t.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label} <span className="ml-1 font-mono text-[10px]">({counts[t.key]})</span>
          </button>
        ))}
      </div>

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
                onClick={() => setSelected({
                  id: member.id,
                  full_name: member.full_name ?? '',
                  phone: member.phone,
                  date_of_birth: member.date_of_birth,
                  role: member.role,
                })}
                className="cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 pr-4 font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span>{member.full_name ?? '—'}</span>
                    {member.role === 'coach' && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">Coach</span>
                    )}
                    {member.role === 'owner' && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Owner</span>
                    )}
                  </div>
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

      {selected && (
        <MemberEditPanel
          member={selected}
          viewerRole={viewerRole}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
