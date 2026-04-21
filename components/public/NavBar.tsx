'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Lang } from '@/lib/i18n'

const NAV_LINKS = [
  { href: '/trainingsplan', label: 'Trainingsplan' },
  { href: '/team',          label: 'Team' },
  { href: '/programme',     label: 'Programme' },
  { href: '/preise',        label: 'Preise' },
  { href: '/blog',          label: 'Blog' },
  { href: '/kontakt',       label: 'Kontakt' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavBarProps {
  currentLang: Lang
}

export function NavBar({ currentLang }: NavBarProps) {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="AXIS JIU JITSU — Zur Startseite" className="shrink-0">
            <Image
              src="/images/logo-full.png"
              alt="AXIS JIU JITSU"
              width={160}
              height={48}
              priority
              className="h-10 w-auto object-contain sm:h-12"
            />
          </Link>

          <div className="hidden items-center gap-6 lg:gap-8 md:flex">
            {NAV_LINKS.map(link => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative text-sm transition-colors',
                    active
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-primary"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitcher currentLang={currentLang} />
            <Link
              href="/login"
              aria-label="Login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogIn size={20} />
            </Link>
            <Link
              href="/trial"
              className="bg-primary px-5 py-2 text-sm font-black tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
            >
              1 WOCHE GRATIS
            </Link>
          </div>

          <button
            className="text-foreground md:hidden"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={open}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer + backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!open}
        aria-label="Hauptmenü"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Image
            src="/images/logo-full.png"
            alt="AXIS JIU JITSU"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
          />
          <button
            onClick={() => setOpen(false)}
            aria-label="Menü schließen"
            className="text-foreground"
          >
            <X size={26} />
          </button>
        </div>

        <div className="flex flex-col px-5 py-6">
          {NAV_LINKS.map(link => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-border py-4 text-base transition-colors',
                  active
                    ? 'font-bold text-primary'
                    : 'text-foreground hover:text-primary'
                )}
              >
                {link.label}
              </Link>
            )
          })}

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 py-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogIn size={18} />
            Login
          </Link>

          <Link
            href="/trial"
            onClick={() => setOpen(false)}
            className="mt-4 bg-primary px-5 py-3 text-center text-sm font-black tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            1 WOCHE GRATIS
          </Link>

          <div className="mt-6 border-t border-border pt-4">
            <LanguageSwitcher currentLang={currentLang} variant="full" />
          </div>
        </div>
      </aside>
    </>
  )
}
