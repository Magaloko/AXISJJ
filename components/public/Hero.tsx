import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#0a0a0a] pt-16">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-action.jpg"
          alt="BJJ Training bei AXIS Jiu-Jitsu Wien"
          fill
          className="object-cover object-center opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-red-600/8 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-red-600">
          Brazilian Jiu-Jitsu Vienna · Since 2020
        </p>

        <h1
          className="mb-6 font-black leading-[0.9] tracking-tighter text-white"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 8rem)' }}
        >
          <span className="block">DISCIPLINE.</span>
          <span className="block">TECHNIQUE.</span>
          <span className="block text-red-600">PROGRESS.</span>
        </h1>

        <p className="mb-2 max-w-md text-base text-gray-300 sm:text-lg">
          Train with Austria&apos;s first Chechen Black Belt —{' '}
          <span className="font-semibold text-white">Shamsudin Baisarov</span>.
        </p>
        <p className="mb-2 text-sm text-gray-500">
          Trainiere mit Österreichs erstem tschetschenischen Schwarzgurt.
        </p>
        <p className="mb-10 text-sm text-gray-600">
          Strindberggasse 1 / R01 · 1110 Wien
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/trial"
            className="inline-block bg-red-600 px-8 py-4 text-sm font-black tracking-widest text-white transition-all hover:bg-red-700 hover:scale-105"
          >
            1 WOCHE GRATIS →
          </Link>
          <a
            href="#trainingsplan"
            className="inline-block border border-white/20 px-8 py-4 text-sm font-semibold tracking-wider text-white transition-colors hover:border-white/50"
          >
            STUNDENPLAN
          </a>
        </div>
      </div>
    </section>
  )
}
