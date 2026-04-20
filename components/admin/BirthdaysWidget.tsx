import type { Birthday } from '@/app/actions/birthdays'

interface Props { birthdays: Birthday[] }

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d}.${m}.`
}

export function BirthdaysWidget({ birthdays }: Props) {
  const today = birthdays.filter(b => b.daysUntil === 0)
  const upcoming = birthdays.filter(b => b.daysUntil > 0 && b.daysUntil <= 14)

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Geburtstage</p>
      <p className="mb-5 text-sm font-semibold text-foreground">Heute & nächste 2 Wochen</p>

      {today.length === 0 && upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Geburtstage in den nächsten 2 Wochen.</p>
      ) : (
        <div className="space-y-3">
          {today.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">🎂 Heute!</p>
              <div className="space-y-1">
                {today.map(b => (
                  <div key={b.profileId} className="flex items-center justify-between border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <span className="font-bold text-foreground">{b.fullName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{b.age} Jahre</span>
                      <a
                        href={`mailto:${b.email}?subject=${encodeURIComponent('Alles Gute zum Geburtstag!')}&body=${encodeURIComponent(`Hey ${b.fullName},\n\nwir wünschen dir alles Gute zum Geburtstag — feier schön und bleib auf der Matte!\n\nDein AXIS-Team`)}`}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                      >
                        Gratulieren
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Bald</p>
              <div className="space-y-1">
                {upcoming.map(b => (
                  <div key={b.profileId} className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm">
                    <span className="font-semibold text-foreground">{b.fullName}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(b.dateOfBirth)}</span>
                      <span className="font-mono">in {b.daysUntil}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
