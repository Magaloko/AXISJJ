import type { InactiveMember } from '@/app/actions/owner-insights'
import { CheckCircle2 } from 'lucide-react'

interface Props { members: InactiveMember[] }

export function InactiveMembersWidget({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Inaktive Mitglieder</p>
        <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 size={16} className="text-primary" strokeWidth={2} />
          Alle aktiv
        </p>
        <p className="text-sm text-muted-foreground">Alle Mitglieder haben in den letzten 30 Tagen trainiert.</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Inaktive Mitglieder</p>
          <p className="text-sm font-semibold text-foreground">Kein Training &gt; 30 Tage</p>
        </div>
        <p className="font-mono text-2xl font-black text-destructive">{members.length}</p>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {members.map(m => (
          <div
            key={m.profileId}
            className="flex items-center justify-between border border-border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{m.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="ml-3 text-right">
              {m.daysSinceLastVisit !== null ? (
                <p className={`font-mono text-sm font-bold ${m.daysSinceLastVisit > 60 ? 'text-destructive' : 'text-amber-600'}`}>
                  {m.daysSinceLastVisit}d
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">nie</p>
              )}
              <a
                href={`mailto:${m.email}?subject=AXIS%20-%20Wir%20vermissen%20dich!&body=Hey%20${encodeURIComponent(m.fullName)},%0A%0Ahaben%20dich%20schon%20l%C3%A4nger%20nicht%20mehr%20auf%20der%20Matte%20gesehen%20%E2%80%94%20alles%20ok%3F%20Komm%20vorbei%2C%20wir%20freuen%20uns!%0A%0ADein%20AXIS-Team`}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Anschreiben
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
