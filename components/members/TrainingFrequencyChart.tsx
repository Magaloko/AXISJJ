'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { week: string; count: number }[]
}

export function TrainingFrequencyChart({ data }: Props) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const lastWeek = data[data.length - 1]?.week

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Trainingsfrequenz</p>
      <p className="mb-4 text-sm font-semibold text-foreground">Letzte 12 Wochen</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={w => w.slice(5)}
            interval={2}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, maxVal + 1]}
          />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v: number | string | ReadonlyArray<number | string> | undefined) => { const n = Number(Array.isArray(v) ? (v as ReadonlyArray<number | string>)[0] : (v ?? 0)); return [`${n} Session${n !== 1 ? 's' : ''}`, ''] as [string, string] }}
            labelFormatter={w => `Woche ${w}`}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.week}
                fill={entry.week === lastWeek ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
