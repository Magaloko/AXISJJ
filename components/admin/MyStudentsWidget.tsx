import type { CoachStudent } from '@/app/actions/coach-insights'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props { students: CoachStudent[] }

export function MyStudentsWidget({ students }: Props) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Meine Mitglieder</p>
      <p className="mb-5 text-sm font-semibold text-foreground">Letzte 30 Tage</p>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Mitglieder in deinen Klassen.</p>
      ) : (
        <div className="space-y-2">
          {students.map((s, i) => (
            <div
              key={s.profileId}
              className="flex items-center justify-between border-b border-border py-2 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                <span className="text-sm font-semibold text-foreground">{s.fullName}</span>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-primary">{s.visitsLast30d}</p>
                <p className="text-[10px] text-muted-foreground">
                  zuletzt {formatDistanceToNow(parseISO(s.lastVisit), { addSuffix: true, locale: de })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
