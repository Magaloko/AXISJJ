import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { LandingPricing } from '@/components/public/LandingPricing'
import { TrialCTA } from '@/components/public/TrialCTA'
import { TournamentSection } from '@/components/public/TournamentSection'
import { DirectionsSection } from '@/components/public/DirectionsSection'
import { HeadCoachSpotlight } from '@/components/public/HeadCoachSpotlight'
import { ContactCard } from '@/components/public/ContactCard'
import { getPricingPlans } from '@/lib/pricing'
import { getWeekSchedule } from '@/lib/schedule'
import { getActiveHeroSlides } from '@/app/actions/hero-slides'
import { getPublicCoaches } from '@/app/actions/public-coaches'
import { getGymSettings } from '@/lib/gym-settings'
import { getEnabledLandingSections } from '@/lib/landing-sections'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { createClient } from '@/lib/supabase/server'
import gymConfig from '@/gym.config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien. Gi, No-Gi, Kids, Fundamentals. Österreichs erster tschetschenischer Schwarzgurt als Head Coach. 1 Woche kostenlos testen.',
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)

  const [schedule, pricingPlans, slides, gymSettingsRes, coaches, gymSettings, enabledSections] = await Promise.all([
    getWeekSchedule(),
    getPricingPlans(),
    getActiveHeroSlides(),
    (supabase as any)
      .from('gym_settings')
      .select('address_line1, address_line2, postal_code, city, public_transport, parking_info, map_embed_url')
      .eq('id', 1)
      .single(),
    getPublicCoaches(),
    getGymSettings(),
    getEnabledLandingSections(),
  ])

  const gs = gymSettingsRes?.data as {
    address_line1: string | null
    address_line2: string | null
    postal_code: string | null
    city: string | null
    public_transport: string | null
    parking_info: string | null
    map_embed_url: string | null
  } | null

  const fullAddress = gs?.address_line1 ?? gymConfig.address

  // Head coach = pinned coach, or first coach as fallback
  const headCoach = coaches.find(c => c.isPinned) ?? coaches[0] ?? null

  const showHeadCoach = enabledSections.has('head_coach_spotlight') && headCoach !== null
  const showContactCard = enabledSections.has('contact_card')

  return (
    <>
      <TrialCTA lang={lang} />
      <StatsBar lang={lang} />
      <CoachSection lang={lang} />
      {showHeadCoach && <HeadCoachSpotlight coach={headCoach!} />}
      <TournamentSection lang={lang} />
      <ProgramsGrid lang={lang} />
      <LandingPricing plans={pricingPlans} lang={lang} />
      <ScheduleWidget schedule={schedule} lang={lang} />
      <Hero slides={slides} lang={lang} />
      <DirectionsSection
        address={fullAddress}
        postalCode={gs?.postal_code ?? undefined}
        city={gs?.city ?? undefined}
        publicTransport={gs?.public_transport ?? undefined}
        parking={gs?.parking_info ?? undefined}
        mapEmbedUrl={gs?.map_embed_url ?? undefined}
      />
      {showContactCard && (
        <section className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">Kontakt</p>
            <h2 className="mb-8 text-3xl font-black uppercase sm:text-4xl">Reach Us</h2>
            <div className="max-w-sm">
              <ContactCard settings={gymSettings} lang={lang} />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
