'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { UtilizationWeek } from '@/app/actions/owner-insights'

interface Props { data: UtilizationWeek[] }

export function UtilizationChart({ data }: Props) {
  const avg = data.length
    ? Math.round(data.reduce((a, w) => a + w.utilization, 0) / data.length)
    : 0
  const lastWeek = data[data.length - 1]?.week

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Auslastung</p>
          <p className="text-sm font-semibold text-foreground">Letzte 8 Wochen</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Ø Auslastung</p>
          <p className="font-mono text-2xl font-black text-primary">{avg}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={w => w.slice(5)}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v) => [`${v}%`, 'Auslastung']}
            labelFormatter={w => `Woche ${w}`}
          />
          <Bar dataKey="utilization" radius={[2, 2, 0, 0]}>
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
