'use client'

import { useEffect, useState } from 'react'
import { getLeaderboard, type LeaderboardEntry } from '@/app/actions/leaderboard'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  const monthLabel = new Date().toLocaleDateString('de-AT', { month: 'long' })

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Leaderboard
      </p>
      <p className="mb-5 text-sm font-semibold text-foreground">{monthLabel} · Top 10</p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Lade...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Trainings diesen Monat. Sei der Erste! 🥋</p>
      ) : (
        <div className="space-y-1">
          {entries.map(e => {
            const medal = MEDALS[e.rank]
            return (
              <div
                key={e.profileId}
                className={`flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-b-0 ${
                  e.isMe ? 'bg-primary/5 rounded' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 text-center font-mono text-sm font-bold ${e.rank <= 3 ? '' : 'text-muted-foreground'}`}>
                    {medal ?? `#${e.rank}`}
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
