import Link from 'next/link'
import { translations, type Lang } from '@/lib/i18n'

interface TrialCTAProps {
  lang: Lang
}

export function TrialCTA({ lang }: TrialCTAProps) {
  const t = translations[lang].public.trialCta
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-primary-foreground/70">
          {t.eyebrow}
        </p>

        <h2 className="mb-4 text-4xl font-black text-primary-foreground sm:text-5xl lg:text-6xl">
          {t.heading}
        </h2>

        <p className="mb-2 text-lg text-primary-foreground/90">
          {t.subtext}
        </p>
        <p className="mb-8 text-sm text-primary-foreground/70">
          {t.descriptive}
        </p>

        <div className="mx-auto mb-8 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-primary-foreground/20" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50">
            {t.levelsWelcome}
          </span>
          <span className="h-px flex-1 bg-primary-foreground/20" />
        </div>

        <Link
          href="/trial"
          className="inline-block border border-primary-foreground px-12 py-5 text-sm font-black tracking-widest text-primary-foreground transition-all hover:bg-primary-foreground/10 hover:scale-105"
        >
          {t.button}
        </Link>

        <p className="mt-6 text-xs text-primary-foreground/50">
          Strindberggasse 1 / R01, 1110 Wien · @axisjj_at
        </p>
      </div>
    </section>
  )
}
