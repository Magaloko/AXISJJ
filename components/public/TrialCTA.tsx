import Link from 'next/link'
import { translations, type Lang } from '@/lib/i18n'

interface TrialCTAProps {
  lang: Lang
}

export function TrialCTA({ lang }: TrialCTAProps) {
  const t = translations[lang].public.trialCta
  return (
    <section className="relative overflow-hidden bg-primary py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.5em] text-primary-foreground/60">
          {t.eyebrow}
        </p>

        <h2 className="mb-6 text-5xl font-black leading-none tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
          {t.heading}
        </h2>

        <p className="mb-2 text-xl font-bold text-primary-foreground">
          {t.subtext}
        </p>
        <p className="mb-10 text-sm text-primary-foreground/70">
          {t.descriptive}
        </p>

        <div className="mx-auto mb-10 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-primary-foreground/20" />
          <span className="text-xs font-black uppercase tracking-widest text-primary-foreground/50">
            {t.levelsWelcome}
          </span>
          <span className="h-px flex-1 bg-primary-foreground/20" />
        </div>

        <Link
          href="/trial"
          className="inline-block bg-primary-foreground px-14 py-5 text-sm font-black tracking-widest text-primary shadow-2xl transition-all hover:scale-105 hover:shadow-primary-foreground/20 active:scale-100"
        >
          {t.button}
        </Link>

        <p className="mt-8 text-xs text-primary-foreground/40">
          Strindberggasse 1 / R01, 1110 Wien · @axisjj_at
        </p>
      </div>
    </section>
  )
}
