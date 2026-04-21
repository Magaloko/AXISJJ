import { getPublicTournaments } from '@/app/actions/public-tournaments'
import { TournamentCard } from './TournamentCard'
import { translations, type Lang } from '@/lib/i18n'

interface TournamentSectionProps {
  lang: Lang
}

export async function TournamentSection({ lang }: TournamentSectionProps) {
  const tournaments = await getPublicTournaments()

  if (tournaments.length === 0) return null

  const tt = translations[lang].public.tournaments

  return (
    <section id="turniere" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {tt.eyebrow}
        </p>
        <h2 className="mb-10 text-3xl sm:text-4xl font-black text-foreground">
          {tt.heading}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
