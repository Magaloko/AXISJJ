'use client'

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  data: { technique: number; conditioning: number; mental: number } | null
}

export function SkillRadarChart({ data }: Props) {
  const chartData = [
    { subject: 'Technik',   value: data?.technique ?? 0 },
    { subject: 'Kondition', value: data?.conditioning ?? 0 },
    { subject: 'Mental',    value: data?.mental ?? 0 },
  ]

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Selbstbewertung</p>
      <p className="mb-2 text-sm font-semibold text-foreground">Ø letzte 30 Tage</p>
      {!data ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Noch keine Daten</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
