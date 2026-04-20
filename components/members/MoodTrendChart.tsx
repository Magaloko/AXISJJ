'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: { date: string; mood_before: number; mood_after: number | null }[]
}

export function MoodTrendChart({ data }: Props) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stimmungsverlauf</p>
      <p className="mb-4 text-sm font-semibold text-foreground">Training hebt die Stimmung</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={d => d.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v: number | string | ReadonlyArray<number | string> | undefined, name: string | number | undefined) => [v, name === 'mood_before' ? 'Vorher' : 'Nachher'] as [number | string | ReadonlyArray<number | string> | undefined, string]}
          />
          <Legend formatter={v => v === 'mood_before' ? 'Vorher' : 'Nachher'} wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="mood_before" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="mood_after" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
