import { isOpenNow, nextOpeningTime, DAY_LABELS_DE } from '@/lib/opening-hours'
import { OpeningHoursDisplay } from '@/components/public/OpeningHoursDisplay'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { hours: OpeningHours }

export function OpeningHoursWidget({ hours }: Props) {
  const now = new Date()
  const open = isOpenNow(hours, now)
  const todayKey = (['mon','tue','wed','thu','fri','sat','sun'] as const)[(now.getDay() + 6) % 7]
  const today = hours[todayKey]
  const next = open ? null : nextOpeningTime(hours, now)

  let statusLine: string
  let statusTone: string
  if (open && today.close) {
    statusLine = `Jetzt geöffnet bis ${today.close}`
    statusTone = 'text-[#2e7d32]'
  } else if (next?.isToday) {
    statusLine = `Geschlossen · öffnet heute um ${next.time}`
    statusTone = 'text-muted-foreground'
  } else if (next) {
    statusLine = `Geschlossen · öffnet ${DAY_LABELS_DE[next.dayKey]} ${next.time}`
    statusTone = 'text-muted-foreground'
  } else {
    statusLine = 'Aktuell geschlossen'
    statusTone = 'text-muted-foreground'
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
      <p className={`mb-3 text-sm font-bold ${statusTone}`}>{statusLine}</p>
      <OpeningHoursDisplay hours={hours} variant="compact" />
    </div>
  )
}
