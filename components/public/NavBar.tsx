'use client'
// navbar with PillNav component
import Link from 'next/link'
import { PillNav } from './PillNav'

const NAV_LINKS = [
  { href: '#trainingsplan', label: 'Trainingsplan' },
  { href: '#team', label: 'Team' },
  { href: '#programme', label: 'Programme' },
  { href: '/preise', label: 'Preise' },
  { href: '/blog', label: 'Blog' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/login', label: 'Login' },
]

export function NavBar() {
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 w-full">
      <div className="relative mx-auto flex max-w-7xl items-start justify-between px-4 py-3 sm:px-6">
        <div className="pointer-events-auto">
          <PillNav
            logo="/images/logo-full.png"
            logoAlt="AXIS JIU JITSU"
            items={NAV_LINKS}
            baseColor="#ffffff"
            pillColor="#0a0a0a"
            pillTextColor="#ffffff"
            hoveredPillTextColor="#0a0a0a"
          />
        </div>
        <Link
          href="/trial"
          className="pointer-events-auto ml-auto mt-[1em] hidden bg-primary px-5 py-[11px] text-sm font-black tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 md:inline-block"
        >
          1 WOCHE GRATIS
        </Link>
      </div>
    </header>
  )
}
