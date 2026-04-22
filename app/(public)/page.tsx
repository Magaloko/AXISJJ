import { cookies } from 'next/headers'
import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { LandingPricing } from '@/components/public/LandingPricing'
import { TrialCTA } from '@/components/public/TrialCTA'
import { TournamentSection } from '@/components/public/TournamentSection'
import { getPricingPlans } from '@/lib/pricing'
import { getWeekSchedule } from '@/lib/schedule'
import { getActiveHeroSlides } from '@/app/actions/hero-slides'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien. Gi, No-Gi, Kids, Fundamentals. Österreichs erster tschetschenischer Schwarzgurt als Head Coach. 1 Woche kostenlos testen.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dbLang: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('language').eq('id', user.id).single()
    dbLang = data?.language ?? null
  }
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, dbLang)

  const [schedule, pricingPlans, slides] = await Promise.all([
    getWeekSchedule(),
    getPricingPlans(),
    getActiveHeroSlides(),
  ])

  return (
    <>
      <TrialCTA lang={lang} />
      <StatsBar lang={lang} />
      <CoachSection lang={lang} />
      <TournamentSection lang={lang} />
      <ProgramsGrid lang={lang} />
      <LandingPricing plans={pricingPlans} lang={lang} />
      <ScheduleWidget schedule={schedule} lang={lang} />
      <Hero slides={slides} lang={lang} />
    </>
  )
}
