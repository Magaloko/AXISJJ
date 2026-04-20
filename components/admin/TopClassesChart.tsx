'use client'

import type { TopClass } from '@/app/actions/owner-insights'

interface Props { data: TopClass[] }

export function TopClassesChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.attendances), 1)

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Beliebteste Klassen</p>
      <p className="mb-5 text-sm font-semibold text-foreground">Letzte 30 Tage · Check-Ins</p>

      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Noch keine Daten</p>
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.name}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="font-mono text-muted-foreground">{item.attendances}</span>
              </div>
              <div className="h-2 w-full overflow-hidden bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(item.attendances / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
