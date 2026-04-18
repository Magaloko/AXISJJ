import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="grid gap-10 sm:grid-cols-3">

          <div>
            <Image
              src="/images/logo.jpg"
              alt="AXIS JIU JITSU"
              width={56}
              height={56}
              className="mb-4 object-contain"
            />
            <p className="text-sm font-black tracking-widest text-foreground">
              AXIS JIU-JITSU VIENNA
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Discipline · Technique · Progress
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Kontakt
            </p>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              Strindberggasse 1 / R01<br />
              1110 Wien, Österreich
            </address>
            <a
              href="https://instagram.com/axisjj_at"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              @axisjj_at
            </a>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="#trainingsplan" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Trainingsplan
              </Link>
              <Link href="#team" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Team
              </Link>
              <Link href="#programme" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Programme
              </Link>
              <Link href="/trial" className="text-sm text-primary transition-colors hover:text-primary/80 font-semibold">
                1 Woche gratis testen
              </Link>
            </nav>
          </div>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} AXIS Jiu-Jitsu Vienna. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6">
            <Link href="/impressum" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Datenschutz
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
