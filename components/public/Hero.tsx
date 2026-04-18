import Link from 'next/link'

export function Hero() {
  return (
    <section className="flex min-h-screen items-center bg-background pt-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-primary">
          Brazilian Jiu-Jitsu Vienna · Since 2020
        </p>

        <h1
          className="mb-6 font-black leading-[0.9] tracking-tighter text-foreground"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 8rem)' }}
        >
          <span className="block">DISCIPLINE.</span>
          <span className="block">TECHNIQUE.</span>
          <span className="block text-primary">PROGRESS.</span>
        </h1>

        <p
          className="mb-2 max-w-md text-lg text-muted-foreground"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          Train with Austria&apos;s first Chechen Black Belt —{' '}
          <span className="font-normal not-italic text-foreground">Shamsudin Baisarov</span>.
        </p>
        <p className="mb-2 text-sm text-muted-foreground">
          Trainiere mit Österreichs erstem tschetschenischen Schwarzgurt.
        </p>
        <p className="mb-10 text-sm text-muted-foreground">
          Strindberggasse 1 / R01 · 1110 Wien
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/trial"
            className="inline-block bg-primary px-8 py-4 text-sm font-black tracking-widest text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
          >
            1 WOCHE GRATIS →
          </Link>
          <a
            href="#trainingsplan"
            className="inline-block border border-border px-8 py-4 text-sm font-semibold tracking-wider text-foreground transition-colors hover:border-foreground/50"
          >
            STUNDENPLAN
          </a>
        </div>

      </div>
    </section>
  )
}
