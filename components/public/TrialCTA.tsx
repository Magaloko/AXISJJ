import Link from 'next/link'

export function TrialCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-950/30 via-[#0a0a0a] to-[#0a0a0a]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-red-600">
          Starte jetzt · Start now
        </p>

        <h2 className="mb-4 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
          1 WOCHE KOSTENLOS TESTEN
        </h2>

        <p className="mb-2 text-lg text-gray-300">
          Try one full week — completely free.
        </p>
        <p className="mb-8 text-sm text-gray-600">
          Keine Anmeldegebühr · Keine Verpflichtung · Einfach kommen
        </p>

        <div className="mx-auto mb-8 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
            Alle Levels willkommen
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Link
          href="/trial"
          className="inline-block bg-red-600 px-12 py-5 text-sm font-black tracking-widest text-white transition-all hover:bg-red-700 hover:scale-105"
        >
          JETZT ANMELDEN →
        </Link>

        <p className="mt-6 text-xs text-gray-700">
          Strindberggasse 1 / R01, 1110 Wien · @axisjj_at
        </p>
      </div>
    </section>
  )
}
