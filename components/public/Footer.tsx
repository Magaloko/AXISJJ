import Image from 'next/image'
import Link from 'next/link'
import { getGymSettings } from '@/lib/gym-settings'
import { OpeningHoursDisplay } from './OpeningHoursDisplay'
import { ContactCard } from './ContactCard'
import { translations, type Lang } from '@/lib/i18n'
import { TextHoverEffect } from '@/components/ui/hover-footer'

interface FooterProps {
  lang: Lang
}

export async function Footer({ lang }: FooterProps) {
  const settings = await getGymSettings()
  const year = new Date().getFullYear()
  const t = translations[lang].public.footer
  const tn = translations[lang].public.navbar

  return (
    <footer className="border-t border-border bg-card py-12 relative overflow-hidden">
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
            <p className="text-sm font-black tracking-widest text-foreground">
              {settings.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Discipline · Technique · Progress
            </p>
            <div className="mt-4">
              <ContactCard settings={settings} lang={lang} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t.openingHours}
            </p>
            <OpeningHoursDisplay hours={settings.opening_hours} variant="compact" lang={lang} />
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t.navigation}
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/preise" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {tn.preise}
              </Link>
              <Link href="/kontakt" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {tn.kontakt}
              </Link>
              <Link href="#trainingsplan" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {tn.trainingsplan}
              </Link>
              <Link href="#team" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {tn.team}
              </Link>
              <Link href="#programme" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {tn.programme}
              </Link>
              <Link href="/trial" className="text-sm text-primary transition-colors hover:text-primary/80 font-semibold">
                {t.trialCta}
              </Link>
            </nav>
          </div>

        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} {settings.name}. {t.allRightsReserved}
          </p>
          <div className="flex gap-6">
            <Link href="/impressum" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {t.impressum}
            </Link>
            <Link href="/datenschutz" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {t.privacy}
            </Link>
          </div>
        </div>

      </div>

      <div className="lg:flex hidden h-48 -mb-16 relative z-10">
        <TextHoverEffect text="AXIS" />
      </div>
    </footer>
  )
}
