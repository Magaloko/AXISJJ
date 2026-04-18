'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#trainingsplan', label: 'Trainingsplan' },
  { href: '#team',          label: 'Team' },
  { href: '#programme',     label: 'Programme' },
  { href: '/preise',        label: 'Preise' },
  { href: '/kontakt',       label: 'Kontakt' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" aria-label="AXIS JIU JITSU — Zur Startseite">
          <Image
            src="/images/logo.jpg"
            alt="AXIS JIU JITSU"
            width={48}
            height={48}
            className="object-contain"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/trial"
            className="bg-primary px-5 py-2 text-sm font-black tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            1 WOCHE GRATIS
          </Link>
        </div>

        <button
          className="text-muted-foreground md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        aria-hidden={!open}
        className={
          open
            ? 'block border-t border-border bg-background px-4 py-4 md:hidden'
            : 'hidden'
        }
      >
        <div className="flex flex-col gap-4">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/trial"
            className="bg-primary px-4 py-2 text-center text-sm font-black tracking-widest text-primary-foreground"
            onClick={() => setOpen(false)}
          >
            1 WOCHE GRATIS
          </Link>
        </div>
      </div>
    </nav>
  )
}
