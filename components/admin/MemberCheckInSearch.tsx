'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkIn } from '@/app/actions/checkin'

interface Member {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface Props { sessionId: string }

export function MemberCheckInSearch({ sessionId }: Props) {
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load all members once
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['member', 'coach'])
      .order('full_name', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (!cancelled && data) setMembers(data)
      })
    return () => { cancelled = true }
  }, [])

  // Filter client-side
  const filtered = query.trim().length < 2
    ? []
    : members
        .filter(m => (m.full_name ?? '').toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)

  function handleCheckIn(member: Member) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await checkIn(member.id, sessionId)
      if (result.error) {
        setError(result.error)
      } else {
        setCheckedInIds(prev => new Set(prev).add(member.id))
        setSuccess(`✓ ${result.memberName ?? member.full_name ?? 'Mitglied'} eingecheckt`)
        setQuery('')
      }
    })
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Quick Check-In (Namen-Suche)
      </p>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Namen tippen (min. 2 Zeichen)..."
        className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {success && <p className="mt-2 text-sm font-semibold text-primary">{success}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {filtered.length > 0 && (
        <div className="mt-2 border border-border bg-background">
          {filtered.map(m => {
            const isCheckedIn = checkedInIds.has(m.id)
            return (
              <button
                key={m.id}
                onClick={() => !isCheckedIn && handleCheckIn(m)}
                disabled={isPending || isCheckedIn}
                className={`flex w-full items-center justify-between border-b border-border/50 px-3 py-2 text-left text-sm last:border-b-0 transition-colors ${
                  isCheckedIn
                    ? 'bg-primary/5 text-muted-foreground cursor-not-allowed'
                    : 'hover:bg-muted'
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground">{m.full_name ?? m.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {m.role === 'coach' ? 'Coach' : 'Mitglied'}
                  </p>
                </div>
                <span className="text-xs">
                  {isCheckedIn ? '✓ Eingecheckt' : 'Check-In →'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {query.trim().length >= 2 && filtered.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Kein Mitglied gefunden.</p>
      )}
    </div>
  )
}
