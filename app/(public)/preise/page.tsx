import Link from 'next/link'
import { PRICING_PLANS } from '@/lib/pricing'
import { PricingCard } from '@/components/public/PricingCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Preise | AXIS Jiu-Jitsu' }

export default function PreisePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-black text-foreground">Preise</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Alle Preise inkl. USt. · Keine Anmeldegebühr.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {PRICING_PLANS.map(plan => (
          <PricingCard key={plan.category} plan={plan} />
        ))}
      </div>

      <div className="mt-12 border border-border bg-card p-8 text-center">
        <p className="mb-4 text-lg font-black text-foreground">
          Unsicher welcher Plan passt?
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Komm zu einem kostenlosen Probetraining und lerne uns kennen.
        </p>
        <Link
          href="/trial"
          className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          Probetraining buchen
        </Link>
      </div>
    </div>
  )
}
