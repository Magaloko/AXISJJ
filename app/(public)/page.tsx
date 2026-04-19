import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { LandingPricing } from '@/components/public/LandingPricing'
import { TrialCTA } from '@/components/public/TrialCTA'
import { getActiveHeroSlides } from '@/app/actions/hero-slides'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
    description: 'Trainiere Brazilian Jiu-Jitsu in Wien. 1 Woche kostenlos testen.',
}

export default async function HomePage() {
    const slides = await getActiveHeroSlides()
    return (
          <>
                <Hero slides={slides} />
                <StatsBar />
                <ScheduleWidget />
                <CoachSection />
                <ProgramsGrid />
                <LandingPricing />
                <TrialCTA />
          </>
        )
}
