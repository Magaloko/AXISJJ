'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props { profileId: string }

interface Point {
  date: string
  technique: number | null
  conditioning: number | null
  mental: number | null
  moodLift: number | null
}

export function MemberProgressChart({ profileId }: Props) {
  const [data, setData] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('training_logs')
      .select('logged_at, mood_before, mood_after, technique, conditioning, mental')
      .eq('profile_id', profileId)
      .order('logged_at', { ascending: true })
      .limit(30)
      .then(({ data: logs }) => {
        if (cancelled) return
        const points: Point[] = (logs ?? []).map(l => ({
          date: l.logged_at.slice(5, 10), // MM-DD
          technique: l.technique,
          conditioning: l.conditioning,
          mental: l.mental,
          moodLift: l.mood_after !== null ? l.mood_after - l.mood_before : null,
        }))
        setData(points)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [profileId])

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Fortschritt (letzte 30 Logs)
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground">Lade...</p>
      ) : data.length < 2 ? (
        <p className="text-xs text-muted-foreground">
          Noch nicht genug Daten — Mitglied braucht min. 2 Training-Logs.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="technique" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name="Technik" />
            <Line type="monotone" dataKey="conditioning" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls name="Kondition" />
            <Line type="monotone" dataKey="mental" stroke="#10b981" strokeWidth={2} dot={false} connectNulls name="Mental" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
