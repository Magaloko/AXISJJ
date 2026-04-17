import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#080808] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="grid gap-10 sm:grid-cols-3">

          <div>
            <Image
              src="/images/logo.png"
              alt="AXIS JIU JITSU"
              width={56}
              height={56}
              className="mb-4 object-contain"
            />
            <p className="text-sm font-black tracking-widest text-white">
              AXIS JIU-JITSU VIENNA
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Discipline · Technique · Progress
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              Kontakt
            </p>
            <address className="not-italic text-sm text-gray-500 leading-relaxed">
              Strindberggasse 1 / R01<br />
              1110 Wien, Österreich
            </address>
            <a
              href="https://instagram.com/axisjj_at"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
            >
              @axisjj_at
            </a>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="#trainingsplan" className="text-sm text-gray-500 hover:text-white transition-colors">
                Trainingsplan
              </Link>
              <Link href="#team" className="text-sm text-gray-500 hover:text-white transition-colors">
                Team
              </Link>
              <Link href="#programme" className="text-sm text-gray-500 hover:text-white transition-colors">
                Programme
              </Link>
              <Link href="/trial" className="text-sm text-red-600 hover:text-red-500 transition-colors font-semibold">
                1 Woche gratis testen
              </Link>
            </nav>
          </div>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-gray-700">
            © {year} AXIS Jiu-Jitsu Vienna. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6">
            <Link href="/impressum" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
