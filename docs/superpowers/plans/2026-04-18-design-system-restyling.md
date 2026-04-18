# AXISJJ Design System Restyling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark hex-hardcoded theme with a light paper design system (oklch tokens, Inter Tight + JetBrains Mono + Instrument Serif fonts) across all existing pages and components.

**Architecture:** Update `globals.css` color token VALUES (keeping token names so Tailwind utilities like `bg-background`, `text-foreground` still work); load three Google Fonts via `next/font/google`; restyle every component replacing hardcoded dark classes (`bg-[#0a0a0a]`, `text-white`, `text-gray-400`, `bg-red-600`, `border-white/5`, etc.) with semantic Tailwind tokens. No routing, data, or behavioral changes anywhere.

**Tech Stack:** Tailwind CSS v4 (`@theme inline`), `next/font/google`, React, Next.js 15 App Router, Vitest + React Testing Library.

---

## Color Replacement Reference

Use this cheat-sheet throughout all tasks:

| Old class | New class |
|-----------|-----------|
| `bg-[#0a0a0a]`, `bg-[#080808]`, `bg-[#0f0f0f]` | `bg-background` |
| `bg-[#111111]`, `bg-[#111]` | `bg-card` |
| `bg-[#1a1a1a]`, `bg-[#222]`, `bg-[#222222]` | `bg-muted` |
| `text-white` | `text-foreground` |
| `text-gray-300`, `text-gray-400` | `text-muted-foreground` |
| `text-gray-500`, `text-gray-600`, `text-gray-700` | `text-muted-foreground` |
| `bg-red-600` | `bg-primary` |
| `hover:bg-red-700` | `hover:bg-primary/90` |
| `text-red-600` | `text-primary` |
| `hover:text-red-500` | `hover:text-primary/80` |
| `border-white/5`, `border-white/10` | `border-border` |
| `hover:bg-white/5`, `hover:bg-white/10` | `hover:bg-muted` |
| `bg-white/5`, `bg-white/10` | `bg-muted` |
| `focus:border-red-600` | `focus:border-primary` |
| `placeholder-gray-600` | `placeholder:text-muted-foreground` |

**Do NOT replace** belt-level accent colors (they represent real belt ranks):
- `border-l-blue-500` (advanced/blue belt)
- `border-l-yellow-500` (kids)
- `border-l-red-600` used as level indicator → keep as `border-l-primary` ✓

---

## File Structure

**Modified (no new files created):**
- `app/globals.css`
- `app/layout.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/public/NavBar.tsx`
- `components/public/Hero.tsx`
- `components/public/StatsBar.tsx`
- `components/public/ScheduleWidget.tsx`
- `components/public/CoachSection.tsx`
- `components/public/ProgramsGrid.tsx`
- `components/public/TrialCTA.tsx`
- `components/public/Footer.tsx`
- `app/(public)/trial/page.tsx`
- `app/login/page.tsx`
- `components/members/MemberNav.tsx`
- `components/members/__tests__/MemberNav.test.tsx`
- `components/members/NextClassCard.tsx`
- `components/members/ClassSlot.tsx`
- `components/members/BeltProgress.tsx`
- `components/members/SkillCard.tsx`
- `components/members/ProfileForm.tsx`
- `components/members/LanguageToggle.tsx`
- `app/(members)/layout.tsx`
- `app/(members)/dashboard/page.tsx`
- `app/(members)/buchen/page.tsx`
- `app/(members)/gurtel/page.tsx`
- `app/(members)/skills/page.tsx`
- `app/(members)/konto/page.tsx`

---

## Task 1: Design Tokens + Font Loading

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Confirm all tests pass before any changes**

```bash
npm test
```

Expected: All tests pass (green). Note the count — it must not decrease after our changes.

- [ ] **Step 2: Update `app/globals.css`**

Replace the entire file content:

```css
@import "tailwindcss";

@theme inline {
  /* === Light paper palette (oklch) === */
  --color-background:       oklch(98% 0.004 80);   /* warm white page */
  --color-foreground:       oklch(16% 0.010 60);   /* near-black text */
  --color-surface-muted:    oklch(91% 0.006 80);   /* hover surface */
  --color-surface-hover:    oklch(89% 0.007 80);   /* active hover */
  --color-border:           oklch(88% 0.006 80);   /* dividers */
  --color-input:            oklch(96% 0.004 80);   /* input fill */
  --color-ring:             oklch(58% 0.21 28);    /* focus ring */

  /* Semantic aliases (Tailwind utilities like bg-card, bg-muted, etc.) */
  --color-card:             oklch(94% 0.005 80);
  --color-card-foreground:  oklch(16% 0.010 60);
  --color-surface:          oklch(94% 0.005 80);
  --color-muted:            oklch(94% 0.005 80);
  --color-muted-foreground: oklch(50% 0.008 60);

  /* Brand / accent */
  --color-primary:          oklch(58% 0.21 28);
  --color-primary-foreground: oklch(99% 0.000 0);
  --color-accent:           oklch(58% 0.21 28);
  --color-accent-foreground: oklch(99% 0.000 0);
  --color-destructive:      oklch(58% 0.21 28);

  /* Legacy brand tokens (used in CoachSection belt swatches) */
  --color-brand-red:        oklch(58% 0.21 28);
  --color-brand-red-dark:   oklch(44% 0.18 28);
  --color-brand-red-light:  oklch(64% 0.22 28);

  /* Background aliases */
  --color-bg:               oklch(98% 0.004 80);

  /* Typography */
  --font-sans:   var(--font-inter-tight), system-ui, sans-serif;
  --font-mono:   var(--font-jetbrains-mono), ui-monospace, monospace;
  --font-serif:  var(--font-instrument-serif), Georgia, serif;

  --radius: 0rem;
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  html {
    scroll-behavior: smooth;
  }
}
```

- [ ] **Step 3: Update `app/layout.tsx`**

Replace the entire file content:

```typescript
import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AXIS Jiu-Jitsu Vienna — Brazilian Jiu-Jitsu in Wien',
    template: '%s | AXIS JJ Vienna',
  },
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien bei Österreichs erstem tschetschenischen Schwarzgurt. Gi, No-Gi, Kids. Jetzt 1 Woche kostenlos testen.',
  keywords: ['BJJ Wien', 'Brazilian Jiu-Jitsu Vienna', 'AXIS JJ', 'Grappling Wien'],
  openGraph: {
    siteName: 'AXIS Jiu-Jitsu Vienna',
    locale: 'de_AT',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${interTight.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Run tests — confirm still passing**

```bash
npm test
```

Expected: Same count as Step 1, all green.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: replace dark tokens with light oklch palette + load Inter Tight/JetBrains Mono/Instrument Serif"
```

---

## Task 2: UI Primitives — Button + Input

**Files:**
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`

These components use Tailwind semantic tokens (`bg-primary`, `bg-muted`, `border-border`) — they get the new look automatically from the token update. The only thing to remove is `dark:` prefix variants (we're light-only now).

- [ ] **Step 1: Update `components/ui/button.tsx`**

Replace entire file:

```typescript
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80 aria-expanded:bg-muted aria-expanded:text-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 2: Update `components/ui/input.tsx`**

Replace entire file:

```typescript
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All green.

- [ ] **Step 4: Commit**

```bash
git add components/ui/button.tsx components/ui/input.tsx
git commit -m "style: remove dark: variants from UI primitives, use semantic tokens"
```

---

## Task 3: NavBar + Footer

**Files:**
- Modify: `components/public/NavBar.tsx`
- Modify: `components/public/Footer.tsx`

- [ ] **Step 1: Update `components/public/NavBar.tsx`**

Replace entire file:

```typescript
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
```

- [ ] **Step 2: Update `components/public/Footer.tsx`**

Replace entire file:

```typescript
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
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|NavBar|Footer)"
```

Expected: NavBar tests PASS.

- [ ] **Step 4: Commit**

```bash
git add components/public/NavBar.tsx components/public/Footer.tsx
git commit -m "style: restyle NavBar + Footer for light paper theme"
```

---

## Task 4: Hero Section

**Files:**
- Modify: `components/public/Hero.tsx`

The Hero moves from a dark full-bleed image to a clean typographic light layout (matching the `index.html` template). The background image is removed. The tagline uses Instrument Serif italic.

- [ ] **Step 1: Update `components/public/Hero.tsx`**

Replace entire file:

```typescript
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
```

- [ ] **Step 2: Run Hero tests**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|Hero)"
```

Expected: All Hero tests PASS.

- [ ] **Step 3: Commit**

```bash
git add components/public/Hero.tsx
git commit -m "style: restyle Hero as clean typographic light layout (remove dark image overlay)"
```

---

## Task 5: StatsBar + TrialCTA

**Files:**
- Modify: `components/public/StatsBar.tsx`
- Modify: `components/public/TrialCTA.tsx`

- [ ] **Step 1: Update `components/public/StatsBar.tsx`**

Replace entire file:

```typescript
const STATS = [
  { value: '10+',  label: 'Klassen / Woche',  sublabel: 'Classes per week' },
  { value: 'GI',   label: 'Gi + No-Gi',        sublabel: 'Both styles' },
  { value: '⬛ BB', label: 'Black Belt Coach',  sublabel: 'Head Coach' },
  { value: 'KIDS', label: 'Kinder willkommen', sublabel: 'ab 6 Jahren' },
]

export function StatsBar() {
  return (
    <div className="border-t border-primary/30 bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-6 sm:grid-cols-4 sm:px-6">
        {STATS.map(stat => (
          <div key={stat.label} className="flex flex-col items-center px-4 py-4 text-center">
            <span
              className="mb-1 text-2xl font-black text-primary sm:text-3xl"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {stat.value}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{stat.label}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{stat.sublabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `components/public/TrialCTA.tsx`**

Replace entire file:

```typescript
import Link from 'next/link'

export function TrialCTA() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-primary-foreground/70">
          Starte jetzt · Start now
        </p>

        <h2 className="mb-4 text-4xl font-black text-primary-foreground sm:text-5xl lg:text-6xl">
          1 WOCHE KOSTENLOS TESTEN
        </h2>

        <p className="mb-2 text-lg text-primary-foreground/90">
          Try one full week — completely free.
        </p>
        <p className="mb-8 text-sm text-primary-foreground/70">
          Keine Anmeldegebühr · Keine Verpflichtung · Einfach kommen
        </p>

        <div className="mx-auto mb-8 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-primary-foreground/20" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50">
            Alle Levels willkommen
          </span>
          <span className="h-px flex-1 bg-primary-foreground/20" />
        </div>

        <Link
          href="/trial"
          className="inline-block border border-primary-foreground px-12 py-5 text-sm font-black tracking-widest text-primary-foreground transition-all hover:bg-primary-foreground/10 hover:scale-105"
        >
          JETZT ANMELDEN →
        </Link>

        <p className="mt-6 text-xs text-primary-foreground/50">
          Strindberggasse 1 / R01, 1110 Wien · @axisjj_at
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|Stats|Trial)"
```

Expected: All green.

- [ ] **Step 4: Commit**

```bash
git add components/public/StatsBar.tsx components/public/TrialCTA.tsx
git commit -m "style: restyle StatsBar (mono numbers) + TrialCTA (accent-red section)"
```

---

## Task 6: ScheduleWidget

**Files:**
- Modify: `components/public/ScheduleWidget.tsx`

The level-accent border colors (`border-l-blue-500`, `border-l-yellow-500`) are kept — they represent real belt levels.

- [ ] **Step 1: Update `components/public/ScheduleWidget.tsx`**

Replace entire file:

```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { SCHEDULE, type ScheduleClass } from '@/lib/utils/schedule-data'

const LEVEL_LABELS: Record<ScheduleClass['level'], string> = {
  beginner: 'Anfänger',
  all:      'Alle Levels',
  advanced: 'Blue Belt+',
  kids:     'Kids',
}

const LEVEL_COLORS: Record<ScheduleClass['level'], string> = {
  beginner: 'border-l-border',
  all:      'border-l-primary',
  advanced: 'border-l-blue-500',
  kids:     'border-l-yellow-500',
}

export function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(0)
  const day = SCHEDULE[activeDay]

  return (
    <section id="trainingsplan" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Schedule · Trainingsplan
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            WÖCHENTLICHER STUNDENPLAN
          </h2>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
          {SCHEDULE.map((d, i) => (
            <button
              key={d.short}
              onClick={() => setActiveDay(i)}
              className={cn(
                'min-w-[52px] flex-shrink-0 px-3 py-2 text-xs font-bold tracking-wider transition-all',
                activeDay === i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              {d.short}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {day.label}
        </p>

        {day.classes.length === 0 ? (
          <p className="text-muted-foreground">Kein Training an diesem Tag.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {day.classes.map(cls => (
              <div
                key={`${cls.name}-${cls.time}`}
                className={cn(
                  'flex items-center justify-between border-l-4 bg-muted px-4 py-4 transition-colors hover:bg-card',
                  LEVEL_COLORS[cls.level]
                )}
              >
                <div>
                  <p className="font-semibold text-foreground">{cls.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{LEVEL_LABELS[cls.level]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-background px-2 py-1 text-xs font-bold text-muted-foreground">
                    {cls.gi ? 'GI' : 'NO-GI'}
                  </span>
                  <div className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                    <p className="text-sm font-bold text-foreground">{cls.time}</p>
                    <p className="text-xs text-muted-foreground">{cls.endTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          * Stundenplan kann variieren. Änderungen auf @axisjj_at.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|Schedule)"
```

Expected: All green.

- [ ] **Step 3: Commit**

```bash
git add components/public/ScheduleWidget.tsx
git commit -m "style: restyle ScheduleWidget for light theme, mono times, keep belt-level accent colors"
```

---

## Task 7: CoachSection + ProgramsGrid

**Files:**
- Modify: `components/public/CoachSection.tsx`
- Modify: `components/public/ProgramsGrid.tsx`

- [ ] **Step 1: Update `components/public/CoachSection.tsx`**

Replace entire file:

```typescript
import Image from 'next/image'

export function CoachSection() {
  return (
    <section id="team" className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Team · Coach
        </p>

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">

          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px flex-1 max-w-[60px] bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Head Coach · Black Belt
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-black leading-tight text-foreground sm:text-5xl">
              SHAMSUDIN BAISAROV
            </h2>

            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-primary/80">
              Erster tschetschenischer BJJ-Schwarzgurt Österreichs
            </p>

            <div className="space-y-4 text-muted-foreground">
              <p>
                Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin
                das Training bei AXIS Jiu-Jitsu. Seine Philosophie: Technik, Disziplin
                und Respekt — auf und abseits der Matte.
              </p>
              <p>
                With years of international competitive experience, Shamsudin leads
                training at AXIS with a philosophy built on discipline, technique,
                and respect — on and off the mat.
              </p>
              <p>
                Ob Anfänger oder Wettkämpfer — unter seiner Anleitung findet jeder
                seinen Weg, stärker zu werden.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2">
              {['White','Blue','Purple','Brown','Black'].map(belt => (
                <div
                  key={belt}
                  title={belt + ' Belt'}
                  className="h-2 flex-1 rounded-sm"
                  style={{
                    background:
                      belt === 'White'  ? '#e5e7eb' :
                      belt === 'Blue'   ? '#1d4ed8' :
                      belt === 'Purple' ? '#7c3aed' :
                      belt === 'Brown'  ? '#78350f' :
                                          '#111111',
                    border: belt === 'Black' ? '1px solid oklch(58% 0.21 28)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 h-full w-3/4 bg-primary/5 blur-2xl" />
            <div className="relative overflow-hidden">
              <Image
                src="/images/Artboard-2-2-1170x536.png"
                alt="Shamsudin Baisarov — Head Coach AXIS Jiu-Jitsu Vienna"
                width={600}
                height={500}
                className="w-full object-cover object-top"
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update `components/public/ProgramsGrid.tsx`**

Replace entire file:

```typescript
import Image from 'next/image'

interface Program {
  name: string
  nameEn: string
  description: string
  level: string
  image: string
  imageAlt: string
  accent: string
}

const PROGRAMS: Program[] = [
  {
    name: 'Fundamentals',
    nameEn: 'Fundamentals',
    description: 'Grundlagen und Techniken für Einsteiger und Weiße Gürtel. Der perfekte Einstieg ins BJJ.',
    level: 'Anfänger · White Belt',
    image: '/images/hero-action.jpg',
    imageAlt: 'Fundamentals BJJ Training',
    accent: 'border-t-border',
  },
  {
    name: 'All Levels Gi',
    nameEn: 'All Levels Gi',
    description: 'Gi-Training für alle Gürtelgrade. Technik, Sparring und Rollwork für jeden Level.',
    level: 'Alle Levels',
    image: '/images/hero-action.jpg',
    imageAlt: 'Gi BJJ Training Wien',
    accent: 'border-t-primary',
  },
  {
    name: 'No-Gi',
    nameEn: 'No-Gi Grappling',
    description: 'Grappling ohne Gi — schnell, athletisch und dynamisch. Für Blue Belt und höher.',
    level: 'Blue Belt+',
    image: '/images/nogi-training.jpg',
    imageAlt: 'No-Gi Grappling Training',
    accent: 'border-t-blue-600',
  },
  {
    name: 'Kids BJJ',
    nameEn: 'Kids BJJ',
    description: 'BJJ für Kinder von 6 bis 14 Jahren. Disziplin, Selbstvertrauen und Spaß auf der Matte.',
    level: '6–14 Jahre',
    image: '/images/kids-bjj.jpg',
    imageAlt: 'Kids BJJ Training Wien',
    accent: 'border-t-yellow-500',
  },
]

export function ProgramsGrid() {
  return (
    <section id="programme" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-12">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Programme · Classes
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            UNSERE KLASSEN
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROGRAMS.map(program => (
            <div
              key={program.name}
              className={`group relative overflow-hidden border-t-4 bg-card ${program.accent} transition-transform hover:-translate-y-1`}
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.imageAlt}
                  fill
                  className="object-cover object-center opacity-70 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              </div>

              <div className="p-6">
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {program.level}
                </span>
                <h3 className="mb-3 text-xl font-black text-foreground">
                  {program.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|Coach|Program)"
```

Expected: All green.

- [ ] **Step 4: Commit**

```bash
git add components/public/CoachSection.tsx components/public/ProgramsGrid.tsx
git commit -m "style: restyle CoachSection + ProgramsGrid for light theme"
```

---

## Task 8: Trial Page + Login Page

**Files:**
- Modify: `app/(public)/trial/page.tsx`
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Update `app/(public)/trial/page.tsx`**

Replace entire file:

```typescript
// app/(public)/trial/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLead } from '@/app/actions/leads'
import { LeadSchema, type LeadFormData } from '@/app/actions/leads.schema'

export default function TrialPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({ resolver: zodResolver(LeadSchema) })

  const onSubmit = async (data: LeadFormData) => {
    setServerError('')
    const result = await createLead(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 inline-block border border-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Danke!
          </div>
          <h1 className="mb-4 text-3xl font-black text-foreground">Wir melden uns bald!</h1>
          <p className="text-muted-foreground">
            Deine Anmeldung ist eingegangen. Unser Team kontaktiert dich innerhalb von 24 Stunden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Kostenlos testen · Free Trial
        </p>
        <h1 className="mb-2 text-4xl font-black text-foreground">1 WOCHE GRATIS</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Keine Anmeldegebühr · Keine Verpflichtung
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Name *
            </label>
            <input
              id="full_name"
              {...register('full_name')}
              placeholder="Dein vollständiger Name"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="deine@email.at"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Telefon (optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+43 ..."
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nachricht (optional)
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={3}
              placeholder="Vorerfahrung, Fragen ..."
              className="w-full resize-none border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet ...' : 'Jetzt Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/login/page.tsx`**

Replace entire file:

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setErrorMsg('Falls diese E-Mail registriert ist, erhältst du einen Magic Link.')
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg('Ungültige E-Mail oder Passwort.')
      setStatus('error')
    } else {
      router.push('/members/dashboard')
      router.refresh()
    }
  }

  if (status === 'success' && mode === 'magic') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-foreground">Check deine E-Mail</h2>
          <p className="text-muted-foreground">
            Wir haben einen Magic Link an <strong className="text-foreground">{email}</strong> gesendet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.jpg" alt="AXIS JIU JITSU" width={56} height={56} className="object-contain" />
        </div>

        <h1 className="mb-1 text-center text-2xl font-black text-foreground">AXIS Member Portal</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Mitglieder-Login</p>

        {/* Mode toggle */}
        <div className="mb-6 flex border border-border">
          <button
            type="button"
            onClick={() => { setMode('magic'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'magic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'password' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Passwort
          </button>
        </div>

        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="deine@email.at"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>
          )}

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Wird geladen ...'
              : mode === 'magic'
              ? 'Link senden →'
              : 'Einloggen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: All green.

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/trial/page.tsx app/login/page.tsx
git commit -m "style: restyle trial + login pages for light theme"
```

---

## Task 9: MemberNav

**Files:**
- Modify: `components/members/MemberNav.tsx`
- Modify: `components/members/__tests__/MemberNav.test.tsx`

The active state keeps `text-red-500` (Tailwind's built-in) so the existing test that checks `.toContain('red')` continues to pass. The test also needs `useRouter` mock added.

- [ ] **Step 1: Update test mock in `components/members/__tests__/MemberNav.test.tsx`**

Replace entire file:

```typescript
// components/members/__tests__/MemberNav.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemberNav } from '../MemberNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MemberNav', () => {
  it('renders user name', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /buchen/i })[0]).toBeInTheDocument()
  })

  it('highlights the active link', () => {
    render(<MemberNav userName="Max Mustermann" />)
    const dashboardLink = screen.getAllByRole('link', { name: /dashboard/i })[0]
    expect(dashboardLink.className).toContain('red')
  })

  it('renders English nav labels when lang is en', () => {
    render(<MemberNav userName="Max Mustermann" lang="en" />)
    expect(screen.getAllByRole('link', { name: /^book$/i })[0]).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it passes with current MemberNav**

```bash
npx vitest run components/members/__tests__/MemberNav.test.tsx --reporter=verbose
```

Expected: All 4 tests PASS.

- [ ] **Step 3: Update `components/members/MemberNav.tsx`**

Replace entire file:

```typescript
// components/members/MemberNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, Award, BookOpen, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { translations, type Lang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

function navItems(lang: Lang): NavItem[] {
  const t = translations[lang].nav
  return [
    { href: '/dashboard', label: t.dashboard, Icon: LayoutDashboard },
    { href: '/buchen',    label: t.buchen,    Icon: Calendar },
    { href: '/gurtel',    label: t.gurtel,    Icon: Award },
    { href: '/skills',    label: t.skills,    Icon: BookOpen },
    { href: '/konto',     label: t.konto,     Icon: Settings },
  ]
}

interface Props {
  userName: string
  lang?: Lang
}

export function MemberNav({ userName, lang = 'de' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const items = navItems(lang)

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex"
        aria-label="Mitglieder Navigation"
      >
        <div className="border-b border-border p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">AXIS Member</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-red-600/10 text-red-500'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card lg:hidden"
        aria-label="Mobile Navigation"
      >
        {items.slice(0, 4).map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide transition-colors',
                active ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>
    </>
  )
}
```

- [ ] **Step 4: Run MemberNav tests**

```bash
npx vitest run components/members/__tests__/MemberNav.test.tsx --reporter=verbose
```

Expected: All 4 tests PASS. If 'highlights the active link' fails, the test is checking for 'red' in the className which should still be present via `text-red-500`.

- [ ] **Step 5: Commit**

```bash
git add components/members/MemberNav.tsx components/members/__tests__/MemberNav.test.tsx
git commit -m "style: restyle MemberNav for light theme; fix test mock for useRouter + pathname"
```

---

## Task 10: NextClassCard + ClassSlot

**Files:**
- Modify: `components/members/NextClassCard.tsx`
- Modify: `components/members/ClassSlot.tsx`

- [ ] **Step 1: Update `components/members/NextClassCard.tsx`**

Replace entire file:

```typescript
// components/members/NextClassCard.tsx
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/utils/dates'
import { translations, type Lang } from '@/lib/i18n'

interface ClassSession {
  id: string
  starts_at: string
  ends_at: string
  location: string
  class_types: { name: string; gi: boolean; level: string } | null
}

interface Props {
  session: ClassSession | null
  bookingId: string | null
  lang?: Lang
}

export function NextClassCard({ session, bookingId, lang = 'de' }: Props) {
  const t = translations[lang].nextClassCard

  if (!session) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t.noBooking}</p>
        <Link
          href="/buchen"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80"
        >
          {t.bookCta}
        </Link>
      </div>
    )
  }

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true

  return (
    <div className="border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-foreground">{typeName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(session.starts_at)}</p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{session.location}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-black tracking-widest ${
            isGi ? 'bg-muted text-foreground' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isGi ? 'GI' : 'NO-GI'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `components/members/ClassSlot.tsx`**

Replace entire file:

```typescript
// components/members/ClassSlot.tsx
'use client'

import { useState } from 'react'
import { formatTime } from '@/lib/utils/dates'
import { bookClass, cancelBooking } from '@/app/actions/bookings'
import { translations, type Lang } from '@/lib/i18n'

interface Session {
  id: string
  starts_at: string
  ends_at: string
  capacity: number
  location: string
  class_types: { name: string; gi: boolean; level: string } | null
}

interface UserBooking {
  id: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
}

interface Props {
  session: Session
  userBooking: UserBooking | null
  confirmedCount: number
  lang?: Lang
}

export function ClassSlot({ session, userBooking, confirmedCount, lang = 'de' }: Props) {
  const t = translations[lang].classSlot
  const [pending, setPending] = useState(false)
  const [booking, setBooking] = useState<UserBooking | null>(userBooking)
  const [count, setCount] = useState(confirmedCount)
  const [error, setError] = useState<string | null>(null)

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true
  const isFull = count >= session.capacity

  const handleBook = async () => {
    setError(null)
    setPending(true)
    const result = await bookClass(session.id)
    if (result.success) {
      setBooking({ id: 'pending', status: result.status === 'confirmed' ? 'confirmed' : 'waitlisted' })
      if (result.status === 'confirmed') setCount(c => c + 1)
    } else {
      setError(result.error ?? t.errorBook)
    }
    setPending(false)
  }

  const handleCancel = async () => {
    if (!booking) return
    setError(null)
    setPending(true)
    const result = await cancelBooking(booking.id)
    if (result.success) {
      if (booking.status === 'confirmed') setCount(c => c - 1)
      setBooking(null)
    } else {
      setError(result.error ?? t.errorCancel)
    }
    setPending(false)
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{typeName}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-black tracking-widest ${
              isGi ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isGi ? 'GI' : 'NO-GI'}
          </span>
          {booking?.status === 'confirmed' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-green-100 text-green-700">
              {t.booked}
            </span>
          )}
          {booking?.status === 'waitlisted' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-yellow-100 text-yellow-700">
              {t.waitlisted}
            </span>
          )}
        </div>
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          &nbsp;·&nbsp;
          <span className={count >= session.capacity ? 'text-destructive' : ''}>
            {count}/{session.capacity}
          </span>
        </p>
      </div>

      <div className="ml-4 flex-shrink-0">
        {booking?.status === 'confirmed' || booking?.status === 'waitlisted' ? (
          <button
            onClick={handleCancel}
            disabled={pending || booking.id === 'pending'}
            aria-label={`${typeName} ${t.cancel}`}
            className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {pending ? '...' : t.cancel}
          </button>
        ) : isFull ? (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.full}</span>
        ) : (
          <button
            onClick={handleBook}
            disabled={pending}
            aria-label={`${typeName} ${t.book}`}
            className="bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {pending ? '...' : t.book}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run components/members/__tests__/NextClassCard.test.tsx components/members/__tests__/ClassSlot.test.tsx --reporter=verbose
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add components/members/NextClassCard.tsx components/members/ClassSlot.tsx
git commit -m "style: restyle NextClassCard + ClassSlot for light theme, mono times"
```

---

## Task 11: BeltProgress

**Files:**
- Modify: `components/members/BeltProgress.tsx`

The SVG has hardcoded `rgba(255,255,255,0.05)` track and `fill="white"` text — both invisible on light background. These must use light-appropriate values.

- [ ] **Step 1: Update `components/members/BeltProgress.tsx`**

Replace entire file:

```typescript
// components/members/BeltProgress.tsx
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  beltName: string | null
  stripes: number
  colorHex: string | null
  readiness: number
  sessionsAttended: number
  monthsInGrade: number
  lang?: Lang
}

export function BeltProgress({ beltName, stripes, colorHex, readiness, sessionsAttended, monthsInGrade, lang = 'de' }: Props) {
  const t = translations[lang].belt

  if (!beltName) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t.noRank}</p>
      </div>
    )
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const clampedReadiness = Math.min(100, Math.max(0, readiness))
  const offset = circumference - (clampedReadiness / 100) * circumference
  const beltColor = colorHex ?? '#e5e7eb'

  return (
    <div className="border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>

      <div className="mt-4 flex items-center gap-6">
        {/* SVG progress ring */}
        <svg
          role="img"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-label={`${beltName} Belt, ${stripes} ${t.stripes}. ${t.readinessLabel}: ${clampedReadiness}%. ${sessionsAttended} ${t.trainings}, ${monthsInGrade} ${t.months}.`}
        >
          {/* Track ring — use border color for light theme visibility */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="oklch(88% 0.006 80)"
            strokeWidth="5"
          />
          {/* Progress ring */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={beltColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
          />
          {/* Percentage text — dark ink color for light theme */}
          <text
            x="40" y="45"
            textAnchor="middle"
            fill="oklch(16% 0.010 60)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="var(--font-mono)"
          >
            {clampedReadiness}%
          </text>
        </svg>

        {/* Belt info */}
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-16 rounded-sm"
              style={{
                backgroundColor: beltColor,
                border: beltColor === '#111111' ? '1px solid oklch(58% 0.21 28)' : undefined,
              }}
            />
          </div>
          <p className="mt-2 text-xl font-black text-foreground">{beltName} Belt</p>
          <p className="text-xs text-muted-foreground">{stripes} {t.stripes}</p>
          <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {sessionsAttended} {t.trainings} · {monthsInGrade} {t.months}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run BeltProgress tests**

```bash
npx vitest run components/members/__tests__/BeltProgress.test.tsx --reporter=verbose
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add components/members/BeltProgress.tsx
git commit -m "style: restyle BeltProgress for light theme (fix SVG track + text colors)"
```

---

## Task 12: SkillCard + ProfileForm + LanguageToggle

**Files:**
- Modify: `components/members/SkillCard.tsx`
- Modify: `components/members/ProfileForm.tsx`
- Modify: `components/members/LanguageToggle.tsx`

- [ ] **Step 1: Update `components/members/SkillCard.tsx`**

Replace entire file:

```typescript
// components/members/SkillCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import { updateSkillStatus } from '@/app/actions/skills'
import { translations, type Lang } from '@/lib/i18n'

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

const STATUS_NEXT: Record<SkillStatus, SkillStatus> = {
  not_started: 'in_progress',
  in_progress: 'mastered',
  mastered: 'not_started',
}

interface Skill {
  id: string
  name: string
  description: string | null
  video_url: string | null
}

interface Props {
  skill: Skill
  initialStatus: SkillStatus
  lang?: Lang
}

export function SkillCard({ skill, initialStatus, lang = 'de' }: Props) {
  const [status, setStatus] = useState<SkillStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const t = translations[lang].skillCard

  const statusLabels: Record<SkillStatus, string> = {
    not_started: t.notStarted,
    in_progress: t.inProgress,
    mastered: t.mastered,
  }

  const cycle = () => {
    const prev = status
    const next = STATUS_NEXT[status]
    setStatus(next)
    startTransition(async () => {
      const result = await updateSkillStatus(skill.id, next)
      if (result.error) setStatus(prev)
    })
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{skill.name}</p>
        {skill.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{skill.description}</p>
        )}
      </div>

      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        {skill.video_url && (
          <a
            href={skill.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label={`${skill.name} Video`}
          >
            ▶
          </a>
        )}
        <button
          onClick={cycle}
          disabled={isPending}
          aria-label={statusLabels[status]}
          className={cn(
            'px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            status === 'mastered'    && 'bg-green-100 text-green-700',
            status === 'in_progress' && 'bg-yellow-100 text-yellow-700',
            status === 'not_started' && 'bg-muted text-muted-foreground'
          )}
        >
          {statusLabels[status]}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `components/members/ProfileForm.tsx`**

Replace entire file:

```typescript
// components/members/ProfileForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { profileSchema, type ProfileFormData } from '@/app/actions/profile.schema'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  profile: { full_name: string; phone: string | null; date_of_birth: string | null; language: string } | null
  lang: Lang
}

export function ProfileForm({ profile, lang }: Props) {
  const t = translations[lang].konto
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    },
  })

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null)
    const result = await updateProfile(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSaved(true)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t.fullName}
        </label>
        <input
          id="full_name"
          {...register('full_name')}
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t.phone}
        </label>
        <input
          id="phone"
          {...register('phone')}
          type="tel"
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="date_of_birth" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t.dateOfBirth}
        </label>
        <input
          id="date_of_birth"
          {...register('date_of_birth')}
          type="date"
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {saved ? t.saved : t.save}
        </button>
        {serverError && <p className="text-xs text-destructive">{serverError}</p>}
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Update `components/members/LanguageToggle.tsx`**

Replace entire file:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateLanguage } from '@/app/actions/profile'
import { cn } from '@/lib/utils/cn'
import type { Lang } from '@/lib/i18n'

interface Props {
  current: Lang
}

export function LanguageToggle({ current }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleChange = (lang: Lang) => {
    if (lang === current) return
    startTransition(async () => {
      const result = await updateLanguage(lang)
      if (!result.error) router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      {(['de', 'en'] as Lang[]).map(lang => (
        <button
          key={lang}
          onClick={() => handleChange(lang)}
          disabled={isPending}
          aria-pressed={current === lang}
          className={cn(
            'border border-border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            current === lang
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run components/members/__tests__/SkillCard.test.tsx components/members/__tests__/ProfileForm.test.tsx components/members/__tests__/LanguageToggle.test.tsx --reporter=verbose
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/members/SkillCard.tsx components/members/ProfileForm.tsx components/members/LanguageToggle.tsx
git commit -m "style: restyle SkillCard + ProfileForm + LanguageToggle for light theme"
```

---

## Task 13: Member Layout + All Member Pages

**Files:**
- Modify: `app/(members)/layout.tsx`
- Modify: `app/(members)/dashboard/page.tsx`
- Modify: `app/(members)/buchen/page.tsx`
- Modify: `app/(members)/gurtel/page.tsx`
- Modify: `app/(members)/skills/page.tsx`
- Modify: `app/(members)/konto/page.tsx`

Read the current `app/(members)/buchen/page.tsx` and `app/(members)/skills/page.tsx` before making changes — they are referenced here but not reproduced in full earlier.

- [ ] **Step 1: Update `app/(members)/layout.tsx`**

Replace entire file:

```typescript
// app/(members)/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/members/MemberNav'
import { resolveLang } from '@/lib/i18n/resolve-lang'

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, language')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email ?? 'Member'
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, profile?.language)

  return (
    <div className="min-h-screen bg-background">
      <MemberNav userName={displayName} lang={lang} />
      <div className="lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `app/(members)/dashboard/page.tsx`**

Find and replace these class names in the file (do NOT change the data/logic code):

```
bg-[#111111]  →  bg-card
border-white/5  →  border-border
text-white  →  text-foreground
text-gray-600  →  text-muted-foreground
text-gray-400  →  text-muted-foreground
```

The stat tile blocks in dashboard look like this after the change:

```typescript
<div className="border border-border bg-card p-6">
  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.trainingsTotal}</p>
  <p className="mt-2 text-4xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{attendanceCount ?? 0}</p>
</div>
<div className="border border-border bg-card p-6">
  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.activeBookings}</p>
  <p className="mt-2 text-4xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{bookingCount ?? 0}</p>
</div>
```

The page `<h1>` becomes:
```typescript
<h1 className="mb-6 text-2xl font-black text-foreground">{t.dashboard.title}</h1>
```

- [ ] **Step 3: Update `app/(members)/buchen/page.tsx`**

Read the file first: `cat app/(members)/buchen/page.tsx`

Apply the same pattern: replace `text-white` → `text-foreground`, `text-gray-*` → `text-muted-foreground`, `bg-[#...]` → `bg-background` or `bg-card`, `border-white/5` → `border-border`.

The page title `<h1>` becomes:
```typescript
<h1 className="mb-6 text-2xl font-black text-foreground">{t.buchen.title}</h1>
```

- [ ] **Step 4: Update `app/(members)/gurtel/page.tsx`**

Apply the same token replacements. Key changes in the rank history section:

```typescript
{/* History card */}
<div className="border border-border bg-card p-6">
  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.history}</p>
  <div className="space-y-3">
    {allRanks.map((row, i) => {
      ...
      return (
        <div key={row.promoted_at ?? i} className="flex items-center gap-3">
          <div
            className="h-2 w-10 flex-shrink-0 rounded-sm"
            style={{ backgroundColor: rank.color_hex ?? '#e5e7eb', border: rank.color_hex === '#111111' ? '1px solid oklch(58% 0.21 28)' : undefined }}
          />
          <span className="text-sm text-foreground">{rank.name} · {rank.stripes} Stripes</span>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {row.promoted_at ? new Date(row.promoted_at).toLocaleDateString('de-AT', { year: 'numeric', month: 'long' }) : '—'}
          </span>
        </div>
      )
    })}
  </div>
</div>
```

Page title: `<h1 className="mb-6 text-2xl font-black text-foreground">{t.title}</h1>`

- [ ] **Step 5: Update `app/(members)/skills/page.tsx`**

Read the file: `cat app/(members)/skills/page.tsx`

Apply the same token replacements. Page title: `<h1 className="mb-6 text-2xl font-black text-foreground">{t.skills.title}</h1>`

The skills container card: `<div className="border border-border bg-card divide-y divide-border">` (if it uses a wrapping container).

- [ ] **Step 6: Update `app/(members)/konto/page.tsx`**

Apply the same token replacements. Key changes:

- Section headings: `text-gray-600` → `text-muted-foreground`
- Document items: `border-white/5 bg-[#111111]` → `border-border bg-card`
- `text-white` → `text-foreground`
- Page title: `<h1 className="mb-6 text-2xl font-black text-foreground">`
- Download link: `text-red-600 hover:text-red-500` → `text-primary hover:text-primary/80`

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: Same count as Task 1 Step 1, all green.

- [ ] **Step 8: Commit**

```bash
git add app/\(members\)/layout.tsx app/\(members\)/dashboard/page.tsx app/\(members\)/buchen/page.tsx app/\(members\)/gurtel/page.tsx app/\(members\)/skills/page.tsx app/\(members\)/konto/page.tsx
git commit -m "style: restyle member layout + all member pages for light theme"
```

---

## Self-Review Checklist

After all tasks are committed, run a final verification:

```bash
npm test
```

Expected: All tests green. If any fail, check the diff for class name assertions that reference dark-specific classes.

Visually verify by running `npm run dev` and checking:
- [ ] Landing page renders with warm paper background, dark text, red accent
- [ ] NavBar has glassmorphism effect (light)
- [ ] Schedule day chips work (click MO–SO)
- [ ] Login page is light themed
- [ ] Member portal sidebar is light
- [ ] Dashboard stat numbers use mono font
- [ ] Belt progress SVG percentage is readable (dark text)
- [ ] LanguageToggle has active state (DE/EN)
