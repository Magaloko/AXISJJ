'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TimelineContent } from '@/components/ui/timeline-animation'
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal'
import { cn } from '@/lib/utils'
import NumberFlow from '@number-flow/react'
import { Baby, CheckCheck, GraduationCap, Sparkles, Swords, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { type PricingCategory, type PricingPlan, type PricingTier } from '@/lib/pricing'
import { translations, type Lang } from '@/lib/i18n'

const CATEGORY_ICONS: Record<PricingCategory, LucideIcon> = {
  students: GraduationCap,
  adults: Swords,
  kids: Baby,
}

type Duration = 12 | 6 | 3 | 1

const DURATIONS: Duration[] = [12, 6, 3, 1]

function DurationSwitch({
  selected,
  onChange,
  className,
  durationLabels,
  save30Label,
}: {
  selected: Duration
  onChange: (d: Duration) => void
  className?: string
  durationLabels: Record<Duration, string>
  save30Label: string
}) {
  return (
    <div className={cn('flex justify-center', className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-xl border border-border bg-card p-1">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              'relative z-10 h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors sm:px-6',
              selected === d ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected === d && (
              <motion.span
                layoutId="duration-switch"
                className="absolute left-0 top-0 h-11 w-full rounded-lg bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative">
              {durationLabels[d]}
              {d === 12 && (
                <span className="ml-2 hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary sm:inline">
                  {save30Label}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function tierFor(plan: PricingPlan, duration: Duration): PricingTier {
  return plan.tiers.find((t) => t.durationMonths === duration) ?? plan.tiers[0]
}

interface LandingPricingProps { plans: PricingPlan[]; lang: Lang }

export function LandingPricing({ plans: PRICING_PLANS, lang }: LandingPricingProps) {
  const [duration, setDuration] = useState<Duration>(12)
  const pricingRef = useRef<HTMLDivElement>(null)
  const tp = translations[lang].public.pricing

  const DURATION_LABELS: Record<Duration, string> = {
    12: tp.duration12,
    6: tp.duration6,
    3: tp.duration3,
    1: tp.duration1,
  }

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { delay: i * 0.15, duration: 0.5 },
    }),
    hidden: { filter: 'blur(10px)', y: -20, opacity: 0 },
  }

  return (
    <section id="preise" ref={pricingRef} className="relative mx-auto max-w-7xl px-4 py-20">
      <article className="mb-10 max-w-2xl space-y-4 text-left">
        <h2 className="mb-4 text-4xl font-black text-foreground md:text-6xl">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.12}
            staggerFrom="first"
            reverse
            containerClassName="justify-start"
            transition={{ type: 'spring', stiffness: 250, damping: 40, delay: 0 }}
          >
            {tp.heading}
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="w-full text-sm text-muted-foreground md:text-base"
        >
          {tp.subtitle}
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
        >
          <DurationSwitch selected={duration} onChange={setDuration} durationLabels={DURATION_LABELS} save30Label={tp.save30} />
        </TimelineContent>
      </article>

      <div className="grid gap-4 py-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan, index) => {
          const tier = tierFor(plan, duration)
          const isPopular = plan.category === 'adults'
          const Icon = CATEGORY_ICONS[plan.category]
          return (
            <TimelineContent
              key={plan.category}
              as="div"
              animationNum={2 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
            >
              <Card
                className={cn(
                  'relative h-full border',
                  isPopular ? 'border-primary/60 bg-primary/[0.03] ring-1 ring-primary/30' : 'border-border bg-card',
                )}
              >
                <CardHeader className="text-left">
                  <div className="flex items-start justify-between">
                    <div>
                      <Icon className="mb-2 h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
                      <h3 className="text-2xl font-black text-foreground md:text-3xl">{plan.titleDe}</h3>
                      {plan.subtitleDe && (
                        <p className="mt-1 text-xs text-muted-foreground">{plan.subtitleDe}</p>
                      )}
                    </div>
                    {isPopular && (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                        {tp.popular}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-baseline">
                    <span className="text-5xl font-black text-foreground">
                      <NumberFlow
                        value={tier.pricePerMonth}
                        format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
                      />
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">{tp.perMonth}</span>
                  </div>
                  {tier.totalPrice !== null && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {tp.total} <NumberFlow
                        value={tier.totalPrice}
                        format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
                      />
                      {duration === 12 && <span className="ml-2 font-sans font-bold text-primary">· {tp.save30}</span>}
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  <Link
                    href="/trial"
                    className={cn(
                      'mb-6 block rounded-lg py-3 text-center text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-90',
                      isPopular
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border bg-foreground text-background',
                    )}
                  >
                    {tp.bookTrial}
                  </Link>

                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tp.allDurations}</p>
                    <ul className="space-y-1.5">
                      {plan.tiers.map((t) => (
                        <li
                          key={t.durationMonths}
                          className={cn(
                            'flex items-center justify-between text-sm',
                            t.durationMonths === duration ? 'font-bold text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {t.durationMonths === duration && (
                              <CheckCheck size={14} className="text-primary" />
                            )}
                            {DURATION_LABELS[t.durationMonths as Duration]}
                          </span>
                          <span className="font-mono">{t.pricePerMonth}{tp.perMonthAbbr}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.noteDe && (
                      <p className="mt-3 flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                        <span>{plan.noteDe}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          )
        })}
      </div>

      <TimelineContent
        as="div"
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="mt-6 text-center"
      >
        <Link href="/preise" className="text-sm font-bold text-primary hover:underline">
          {tp.fullOverview}
        </Link>
      </TimelineContent>
    </section>
  )
}
