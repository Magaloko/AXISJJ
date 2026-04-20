import Link from 'next/link'
import { CoachSection } from '@/components/public/CoachSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team | AXIS Jiu-Jitsu Vienna',
  description:
    'Lerne die Coaches von AXIS Jiu-Jitsu Vienna kennen. Angeführt von Shamsudin Baisarov, Österreichs erstem tschetschenischem BJJ-Schwarzgurt.',
}

export default function TeamPage() {
  return (
    <div className="pt-20">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Team · Coaches
        </p>
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          UNSERE COACHES
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Erfahrene Schwarzgurte und Instruktoren, die dich vom ersten Tag an begleiten —
          mit Fokus auf Technik, Respekt und Disziplin.
        </p>
      </div>

      <CoachSection />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="border border-border bg-card p-8 text-center">
          <p className="mb-2 text-lg font-black text-foreground">
            Willst du mit uns trainieren?
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Komm zu einem kostenlosen Probetraining und erlebe AXIS auf der Matte.
          </p>
          <Link
            href="/trial"
            className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Probetraining buchen
          </Link>
        </div>
      </div>
    </div>
  )
}
