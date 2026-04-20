import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { LandingPricing } from '@/components/public/LandingPricing'
import { TrialCTA } from '@/components/public/TrialCTA'
import { getPricingPlans } from '@/lib/pricing'
import { getWeekSchedule } from '@/lib/schedule'
import { getActiveHeroSlides } from '@/app/actions/hero-slides'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien. Gi, No-Gi, Kids, Fundamentals. Österreichs erster tschetschenischer Schwarzgurt als Head Coach. 1 Woche kostenlos testen.',
}

export default async function HomePage() {
  const [schedule, pricingPlans, slides] = await Promise.all([
    getWeekSchedule(),
    getPricingPlans(),
    getActiveHeroSlides(),
  ])

  return (
    <>
      <TrialCTA />
      <StatsBar />
      <CoachSection />
      <ProgramsGrid />
      <LandingPricing plans={pricingPlans} />
      <ScheduleWidget schedule={schedule} />
      <Hero slides={slides} />
    </>
  )
}
