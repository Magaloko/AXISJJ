'use client'

import { useState, useTransition } from 'react'
import { updateMemberRole } from '@/app/actions/members'
import { useRouter } from 'next/navigation'

interface Profile { id: string; full_name: string; role: 'member' | 'coach' | 'owner' }

interface Props { coaches: Profile[]; members: Profile[] }

export function RoleManager({ coaches, members }: Props) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = members.filter(m => m.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

  function change(id: string, role: 'member' | 'coach', label: string) {
    if (!confirm(label)) return
    setError(null)
    startTransition(async () => {
      const result = await updateMemberRole(id, role)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Rollen & Zugänge</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Coaches</p>
      <ul className="mb-4 divide-y divide-border">
        {coaches.length === 0 && <li className="py-2 text-sm text-muted-foreground">Keine Coaches</li>}
        {coaches.map(c => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span className="text-sm font-bold">{c.full_name} <span className="text-xs font-normal text-muted-foreground">Coach</span></span>
            <button onClick={() => change(c.id, 'member', `${c.full_name} zum Mitglied machen?`)}
                    disabled={isPending}
                    className="border border-border px-2 py-1 text-[10px] text-primary disabled:opacity-50">
              → Mitglied
            </button>
          </li>
        ))}
      </ul>

      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Mitglied zum Coach machen</p>
      <input className="mb-2 w-full border border-border bg-background p-2 text-sm" placeholder="Name suchen ..."
             value={query} onChange={e => setQuery(e.target.value)} />
      {query && (
        <ul className="divide-y divide-border">
          {filtered.length === 0 && <li className="py-2 text-sm text-muted-foreground">Keine Treffer</li>}
          {filtered.map(m => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-bold">{m.full_name}</span>
              <button onClick={() => change(m.id, 'coach', `${m.full_name} zum Coach machen?`)}
                      disabled={isPending}
                      className="bg-foreground px-2 py-1 text-[10px] font-bold text-background disabled:opacity-50">
                → Coach
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
