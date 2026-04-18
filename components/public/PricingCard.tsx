import { Baby, GraduationCap, Sparkles, Swords, type LucideIcon } from 'lucide-react'
import type { PricingCategory, PricingPlan } from '@/lib/pricing'

const CATEGORY_ICONS: Record<PricingCategory, LucideIcon> = {
  students: GraduationCap,
  adults: Swords,
  kids: Baby,
}

interface Props {
  plan: PricingPlan
}

export function PricingCard({ plan }: Props) {
  const Icon = CATEGORY_ICONS[plan.category]
  return (
    <div className="flex flex-col border border-border bg-card">
      <div className="border-b border-border p-6">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-2 text-lg font-black text-foreground">{plan.titleDe}</h2>
        {plan.subtitleDe && (
          <p className="text-xs text-muted-foreground">{plan.subtitleDe}</p>
        )}
      </div>

      <ul className="flex-1 divide-y divide-border">
        {plan.tiers.map(tier => (
          <li
            key={tier.durationMonths}
            className={`relative p-4 ${tier.highlighted ? 'bg-primary/5' : ''}`}
          >
            {tier.highlighted && (
              <span className="absolute right-3 top-3 bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                Beste Wahl
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {tier.durationMonths} {tier.durationMonths === 1 ? 'Monat' : 'Monate'}
            </p>
            <p className="mt-1 font-mono text-xl font-black text-foreground">
              {tier.pricePerMonth}€
              <span className="ml-1 text-xs font-normal text-muted-foreground">/Monat</span>
            </p>
            {tier.totalPrice !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                gesamt <span className="font-mono">{tier.totalPrice}€</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {plan.noteDe && (
        <div className="border-t border-border bg-muted/40 p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
            <span>{plan.noteDe}</span>
          </p>
        </div>
      )}
    </div>
  )
}
