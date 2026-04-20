import Link from 'next/link'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { getWeekSchedule } from '@/lib/schedule'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trainingsplan | AXIS Jiu-Jitsu Vienna',
  description:
    'Wöchentlicher Stundenplan bei AXIS Jiu-Jitsu Vienna. Gi, No-Gi, Fundamentals, Kids. Alle Klassen, Uhrzeiten und Coaches auf einen Blick.',
}

export default async function TrainingsplanPage() {
  const schedule = await getWeekSchedule()

  return (
    <div className="pt-20">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          TRAININGSPLAN
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Unser wöchentlicher Stundenplan. Für Mitglieder ist die Buchung online möglich —
          Neulinge kommen einfach 15 Minuten vor Beginn ins Gym.
        </p>
      </div>

      <ScheduleWidget schedule={schedule} />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="border border-border bg-card p-8 text-center">
          <p className="mb-2 text-lg font-black text-foreground">
            Erste Mal auf der Matte?
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Teste uns eine Woche lang kostenlos. Keine Vorkenntnisse, keine Verpflichtung.
          </p>
          <Link
            href="/trial"
            className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            1 Woche gratis starten
          </Link>
        </div>
      </div>
    </div>
  )
}
