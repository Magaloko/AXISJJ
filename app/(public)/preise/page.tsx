import { cookies } from 'next/headers'
import Link from 'next/link'
import { getPricingPlans } from '@/lib/pricing'
import { PricingCard } from '@/components/public/PricingCard'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Preise | AXIS Jiu-Jitsu' }

export default async function PreisePage() {
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)
  const plans = await getPricingPlans()
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-black text-foreground">Preise</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Alle Preise inkl. USt. · Keine Anmeldegebühr.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(plan => (
          <PricingCard key={plan.category} plan={plan} lang={lang} />
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-border bg-card p-8">
          <p className="mb-2 text-lg font-black text-foreground">Jetzt Mitglied werden</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Formular online ausfüllen — wir bereiten alles vor. Unterschrift beim ersten Training.
          </p>
          <Link
            href="/anmelden"
            className="inline-block bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            Online anmelden →
          </Link>
        </div>

        <div className="border border-border bg-card p-8">
          <p className="mb-2 text-lg font-black text-foreground">Vertrag herunterladen</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Vertrag ausdrucken, ausfüllen und beim Training mitbringen oder an office@axisjj.at senden.
          </p>
          <a
            href="/vertrag.pdf"
            download="AXIS_Mitgliedsvertrag.pdf"
            className="inline-block border border-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            PDF herunterladen
          </a>
        </div>
      </div>
    </div>
  )
}
