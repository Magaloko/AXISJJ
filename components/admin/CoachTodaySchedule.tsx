import type { CoachTodaySession } from '@/app/actions/coach-insights'

interface Props { sessions: CoachTodaySession[] }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function CoachTodaySchedule({ sessions }: Props) {
  const now = new Date()

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Heute unterrichte ich</p>
      <p className="mb-5 text-sm font-semibold text-foreground">
        {sessions.length === 0 ? 'Keine Sessions' : `${sessions.length} Session${sessions.length !== 1 ? 's' : ''}`}
      </p>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Heute hast du keine Trainings zu unterrichten.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const isPast = new Date(s.ends_at) < now
            const isNow = new Date(s.starts_at) <= now && new Date(s.ends_at) >= now
            const utilization = s.capacity > 0 ? Math.round((s.confirmedCount / s.capacity) * 100) : 0
            return (
              <div
                key={s.id}
                className={`border-l-4 p-4 ${
                  isNow ? 'border-l-primary bg-primary/5'
                  : isPast ? 'border-l-border bg-muted/30 opacity-70'
                  : 'border-l-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {s.className}
                      {isNow && <span className="ml-2 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">LÄUFT</span>}
                      {isPast && <span className="ml-2 text-[10px] text-muted-foreground">beendet</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {formatTime(s.starts_at)} – {formatTime(s.ends_at)}
                    </p>
                    {s.location && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-foreground">
                      {s.confirmedCount}/{s.capacity}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{utilization}% voll</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
