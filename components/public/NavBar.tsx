'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#trainingsplan', label: 'Trainingsplan' },
  { href: '#team',          label: 'Team' },
  { href: '#programme',     label: 'Programme' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-sm">
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
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/trial"
            className="bg-red-600 px-5 py-2 text-sm font-black tracking-widest text-white transition-colors hover:bg-red-700"
          >
            1 WOCHE GRATIS
          </Link>
        </div>

        <button
          className="text-gray-400 md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div aria-hidden={!open} className={open ? 'block border-t border-white/5 bg-[#0a0a0a] px-4 py-4 md:hidden' : 'hidden'}>
        <div className="flex flex-col gap-4">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-gray-400"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/trial"
            className="bg-red-600 px-4 py-2 text-center text-sm font-black tracking-widest text-white"
            onClick={() => setOpen(false)}
          >
            1 WOCHE GRATIS
          </Link>
        </div>
      </div>
    </nav>
  )
}
