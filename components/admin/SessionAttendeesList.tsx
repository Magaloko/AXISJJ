'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Attendee {
  profile_id: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  waitlist_position: number | null
  full_name: string
}

interface Props { sessionId: string }

export function SessionAttendeesList({ sessionId }: Props) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('profile_id, status, waitlist_position, profiles(full_name)')
      .eq('session_id', sessionId)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        if (cancelled) return
        const list: Attendee[] = (data ?? []).map(b => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
          return {
            profile_id: b.profile_id,
            status: b.status,
            waitlist_position: b.waitlist_position,
            full_name: profile?.full_name ?? 'Unbekannt',
          }
        })
        // confirmed first by name, then waitlisted by position
        list.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1
          if (a.status === 'waitlisted') {
            return (a.waitlist_position ?? 999) - (b.waitlist_position ?? 999)
          }
          return a.full_name.localeCompare(b.full_name)
        })
        setAttendees(list)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId])

  const confirmed = attendees.filter(a => a.status === 'confirmed')
  const waitlisted = attendees.filter(a => a.status === 'waitlisted')

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Teilnehmer ({loading ? '...' : confirmed.length}{waitlisted.length > 0 && ` + ${waitlisted.length} Warteliste`})
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Lade...</p>
      ) : confirmed.length === 0 && waitlisted.length === 0 ? (
        <p className="text-xs text-muted-foreground">Keine Buchungen.</p>
      ) : (
        <div className="space-y-2">
          {confirmed.map(a => (
            <div key={a.profile_id} className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm">
              <span className="font-semibold text-foreground">{a.full_name}</span>
              <span className="text-[10px] text-primary">✓ Bestätigt</span>
            </div>
          ))}
          {waitlisted.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Warteliste</p>
              {waitlisted.map(a => (
                <div key={a.profile_id} className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm mb-1">
                  <span className="text-muted-foreground">
                    <span className="font-mono mr-2">#{a.waitlist_position ?? '?'}</span>
                    {a.full_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Warteliste</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
