import { getPublicCoaches } from '@/app/actions/public-coaches'
import { CoachSlider } from './CoachSlider'

export async function CoachSection() {
  const coaches = await getPublicCoaches()

  if (coaches.length === 0) return null

  return (
    <section id="team" className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-10 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Team · Coach
        </p>
        <CoachSlider coaches={coaches} />
      </div>
    </section>
  )
}
