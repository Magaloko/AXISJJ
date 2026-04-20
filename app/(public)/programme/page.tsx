import Link from 'next/link'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programme | AXIS Jiu-Jitsu Vienna',
  description:
    'BJJ Programme bei AXIS Jiu-Jitsu Vienna: Fundamentals, Gi, No-Gi, Kids und Wettkampftraining. Für jede Stufe das passende Training.',
}

export default function ProgrammePage() {
  return (
    <div className="pt-20">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Programme · Classes
        </p>
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">
          UNSERE PROGRAMME
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Vom ersten Armbar bis zur Wettkampfvorbereitung — unsere Klassen decken jeden
          Punkt deines Jiu-Jitsu-Wegs ab.
        </p>
      </div>

      <ProgramsGrid />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="border border-border bg-card p-8 text-center">
          <p className="mb-2 text-lg font-black text-foreground">
            Welches Programm passt zu dir?
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Finde es heraus — 1 Woche gratis trainieren, ganz ohne Verpflichtung.
          </p>
          <Link
            href="/trial"
            className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Jetzt starten
          </Link>
        </div>
      </div>
    </div>
  )
}
