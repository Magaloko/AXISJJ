import Link from 'next/link'
import type { TodayAttendanceSummary } from '@/app/actions/admin'

interface Props {
  summary: TodayAttendanceSummary
}

function formatTime(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function MissingCheckinsWidget({ summary }: Props) {
  const { booked, checkedIn, missing } = summary
  const pct = booked === 0 ? 0 : Math.round((checkedIn / booked) * 100)
  const visible = missing.slice(0, 6)
  const hiddenCount = missing.length - visible.length

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Anwesenheit heute
        </p>
        <Link
          href="/admin/checkin"
          className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80"
        >
          Check-In →
        </Link>
      </div>

      <p className="font-mono text-3xl font-black text-foreground">
        {checkedIn}
        <span className="text-muted-foreground">/{booked}</span>
        <span className="ml-2 text-sm font-bold text-muted-foreground">{pct}%</span>
      </p>

      <div className="mt-2 h-1.5 w-full bg-muted" aria-hidden="true">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {missing.length === 0 ? 'Alle anwesend ✓' : `Fehlt (${missing.length})`}
      </p>

      {missing.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {visible.map((m) => (
            <li
              key={`${m.profileId}:${m.sessionId}`}
              className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1.5 text-sm last:border-b-0"
            >
              <span className="font-semibold text-foreground">{m.memberName}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatTime(m.sessionStartsAt)} · {m.className}
              </span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="pt-1 text-xs text-muted-foreground">
              +{hiddenCount} weitere
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
