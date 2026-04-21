import { getPublicCoaches } from '@/app/actions/public-coaches'
import { CoachSlider } from './CoachSlider'
import { translations, type Lang } from '@/lib/i18n'

interface CoachSectionProps {
  lang: Lang
}

export async function CoachSection({ lang }: CoachSectionProps) {
  const coaches = await getPublicCoaches()

  if (coaches.length === 0) return null

  return (
    <section id="team" className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-10 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {translations[lang].public.coaches.eyebrow}
        </p>
        <CoachSlider coaches={coaches} lang={lang} />
      </div>
    </section>
  )
}
