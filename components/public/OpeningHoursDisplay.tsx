import { DAY_LABELS_DE, groupIntoRanges } from '@/lib/opening-hours'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { hours: OpeningHours; variant?: 'compact' | 'full' }

export function OpeningHoursDisplay({ hours, variant = 'full' }: Props) {
  if (variant === 'compact') {
    const { ranges, closedDays } = groupIntoRanges(hours)
    return (
      <ul className="space-y-1 text-sm text-muted-foreground">
        {ranges.map((r, i) => {
          const daySpan = r.days.length === 1
            ? DAY_LABELS_DE[r.days[0]]
            : `${DAY_LABELS_DE[r.days[0]]}–${DAY_LABELS_DE[r.days[r.days.length - 1]]}`
          return (
            <li key={i} className="flex justify-between gap-6">
              <span>{daySpan}</span>
              <span className="font-mono">{r.open} – {r.close}</span>
            </li>
          )
        })}
        {closedDays.length > 0 && (
          <li className="flex justify-between gap-6">
            <span>{closedDays.map(d => DAY_LABELS_DE[d]).join(', ')}</span>
            <span className="text-xs italic">geschlossen</span>
          </li>
        )}
      </ul>
    )
  }

  return (
    <ul className="space-y-1 text-sm">
      {(Object.keys(hours) as Array<keyof typeof hours>).map(key => {
        const day = hours[key]
        return (
          <li key={key} className="flex justify-between gap-6">
            <span className="font-bold">{DAY_LABELS_DE[key]}</span>
            {day.closed ? (
              <span className="text-xs italic text-muted-foreground">geschlossen</span>
            ) : (
              <span className="font-mono text-muted-foreground">{day.open} – {day.close}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
