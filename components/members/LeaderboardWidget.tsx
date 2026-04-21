'use client'

import { useEffect, useState } from 'react'
import { getLeaderboard, type LeaderboardEntry } from '@/app/actions/leaderboard'
import { MedalIcon, AnimatedGiIcon } from '@/components/ui/icons/animated-icons'

type LoadState = 'loading' | 'ready' | 'error'

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    let active = true
    getLeaderboard()
      .then(data => {
        if (!active) return
        setEntries(data)
        setState('ready')
      })
      .catch(() => {
        if (!active) return
        setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  const monthLabel = new Date().toLocaleDateString('de-AT', { month: 'long' })

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Leaderboard
      </p>
      <p className="mb-5 text-sm font-semibold text-foreground">{monthLabel} · Top 10</p>

      {state === 'loading' && <p className="text-sm text-muted-foreground">Lade...</p>}
      {state === 'error' && (
        <p className="text-sm text-muted-foreground">Leaderboard konnte nicht geladen werden.</p>
      )}
      {state === 'ready' && entries.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Noch keine Trainings diesen Monat. Sei der Erste!</span>
          <AnimatedGiIcon size={18} animate="hover" />
        </div>
      )}
      {state === 'ready' && entries.length > 0 && (
        <div className="space-y-1">
          {entries.map(e => {
            const isMedal = e.rank >= 1 && e.rank <= 3
            return (
              <div
                key={e.profileId}
                className={`flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-b-0 ${
                  e.isMe ? 'bg-primary/5 rounded' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex w-8 items-center justify-center">
                    {isMedal ? (
                      <MedalIcon size={24} place={e.rank as 1 | 2 | 3} animate />
                    ) : (
                      <span className="font-mono text-sm font-bold text-muted-foreground">#{e.rank}</span>
                    )}
                  </span>
                  <span className={`text-sm ${e.isMe ? 'font-black text-primary' : 'font-semibold text-foreground'}`}>
                    {e.fullName}{e.isMe && ' (Du)'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-foreground">
                  {e.attendances}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
