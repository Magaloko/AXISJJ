'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Competition {
  id: string
  name: string
  date: string
  location: string | null
  category: string | null
  placement: string | null
  notes: string | null
}

interface Props { profileId: string }

export function MemberCompetitionsView({ profileId }: Props) {
  const [comps, setComps] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('competitions')
      .select('id, name, date, location, category, placement, notes')
      .eq('profile_id', profileId)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setComps(data ?? [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [profileId])

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Wettkämpfe ({loading ? '...' : comps.length})
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Lade...</p>
      ) : comps.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Wettkämpfe.</p>
      ) : (
        <div className="space-y-2">
          {comps.slice(0, 5).map(c => (
            <div key={c.id} className="border border-border bg-background p-2 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground">{c.name}</p>
                {c.placement && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {c.placement}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-muted-foreground">
                {new Date(c.date).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}
                {c.location && ` · ${c.location}`}
              </p>
            </div>
          ))}
          {comps.length > 5 && (
            <p className="text-[10px] text-muted-foreground">… und {comps.length - 5} weitere</p>
          )}
        </div>
      )}
    </div>
  )
}
