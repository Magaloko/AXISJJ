# AXISJJ Phase 2 — Auth, Trial Form, Member Dashboard & Booking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authentication (email/password + magic link), the public trial signup form, and the core member portal (dashboard + class booking).

**Architecture:** Server actions for mutations (leads, bookings); server components for data fetching; client components only where interactivity is required. Auth handled entirely via Supabase Auth. The `/auth/callback` route exchanges magic-link codes for sessions. Member layout wraps all `/members/*` routes with a sidebar nav and a server-side auth check.

**Tech Stack:** Next.js 15 App Router, Supabase (`@supabase/ssr`), react-hook-form + zod (v4), date-fns v4, lucide-react, Tailwind CSS v4, Vitest + @testing-library/react

**Supabase project:** `https://serrkmokwxqkupugkxud.supabase.co`

---

## File Map

```
app/
├── (public)/
│   └── trial/
│       └── page.tsx               # Trial signup form page
├── login/
│   └── page.tsx                   # Login: email/password + magic link
├── auth/
│   └── callback/
│       └── route.ts               # Exchanges Supabase code for session
├── actions/
│   ├── leads.ts                   # createLead server action
│   └── bookings.ts                # bookClass, cancelBooking server actions
└── (members)/
    ├── layout.tsx                 # Auth-guarded sidebar wrapper
    ├── dashboard/
    │   └── page.tsx               # Next class + attendance count
    └── buchen/
        └── page.tsx               # Class booking grid (next 7 days)

components/
└── members/
    ├── MemberNav.tsx              # Sidebar (desktop) + bottom tabs (mobile)
    ├── NextClassCard.tsx          # Shows next confirmed class
    └── ClassSlot.tsx              # Single session: time, type, book/cancel button

lib/
└── utils/
    └── dates.ts                   # date-fns helpers: formatTime, formatDate, etc.
```

---

## Task 1: Date Utility Functions

**Files:**
- Create: `lib/utils/dates.ts`
- Create: `lib/utils/__tests__/dates.test.ts` (add to existing test file)

- [ ] **Step 1: Write the failing tests**

Create `lib/utils/__tests__/dates.test.ts` (add after existing tests or as new file):
```typescript
// lib/utils/__tests__/dates.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatTime, formatDateShort, getNextSevenDays, getDayLabel } from '../dates'

describe('dates utils', () => {
  it('formatTime returns HH:mm string', () => {
    // Use a UTC time that's unambiguous
    const result = formatTime('2026-04-17T08:00:00.000Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formatDateShort returns abbreviated date', () => {
    const result = formatDateShort('2026-04-17T08:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('getNextSevenDays returns exactly 7 Date objects', () => {
    const days = getNextSevenDays()
    expect(days).toHaveLength(7)
    expect(days[0]).toBeInstanceOf(Date)
  })

  it('getDayLabel returns Heute for today', () => {
    expect(getDayLabel(new Date())).toBe('Heute')
  })

  it('getDayLabel returns Morgen for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(getDayLabel(tomorrow)).toBe('Morgen')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- lib/utils/__tests__/dates 2>&1 | tail -10
```

- [ ] **Step 3: Create `lib/utils/dates.ts`**

```typescript
// lib/utils/dates.ts
import { format, addDays, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'HH:mm')
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE, d. MMMM', { locale: de })
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'EEE d.M.', { locale: de })
}

export function getNextSevenDays(): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i))
}

export function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Heute'
  if (isTomorrow(date)) return 'Morgen'
  return format(date, 'EEEE', { locale: de })
}

export { startOfDay, endOfDay, addDays }
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- lib/utils/__tests__/dates 2>&1 | tail -10
```
Expected: all 5 new tests + all previous tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/dates.ts lib/utils/__tests__/dates.test.ts
git commit -m "feat: add date utility functions (formatTime, formatDate, getNextSevenDays)"
```

---

## Task 2: Trial Signup Form

**Files:**
- Create: `app/actions/leads.ts`
- Create: `app/(public)/trial/page.tsx`
- Create: `app/(public)/trial/__tests__/TrialForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `app/(public)/trial/__tests__/TrialForm.test.tsx`:
```typescript
// app/(public)/trial/__tests__/TrialForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TrialPage from '../page'

// Mock the server action
vi.mock('@/app/actions/leads', () => ({
  createLead: vi.fn(),
}))

import { createLead } from '@/app/actions/leads'

describe('Trial signup page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders the signup form', () => {
    render(<TrialPage />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument()
  })

  it('shows success state after submission', async () => {
    vi.mocked(createLead).mockResolvedValueOnce({ success: true })
    render(<TrialPage />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Max Mustermann' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'max@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/danke/i)).toBeInTheDocument()
    })
  })

  it('shows error when server action fails', async () => {
    vi.mocked(createLead).mockResolvedValueOnce({ error: 'Fehler beim Speichern' })
    render(<TrialPage />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Max Mustermann' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'max@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/fehler/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- trial 2>&1 | tail -15
```

- [ ] **Step 3: Create `app/actions/leads.ts`**

```typescript
// app/actions/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LeadSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export async function createLead(data: unknown): Promise<{ success?: boolean; error?: string }> {
  const parsed = LeadSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Bitte alle Pflichtfelder korrekt ausfüllen.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    source: 'website',
    status: 'new',
  })

  if (error) {
    return { error: 'Fehler beim Speichern. Bitte versuche es erneut.' }
  }

  return { success: true }
}
```

- [ ] **Step 4: Create `app/(public)/trial/page.tsx`**

```typescript
// app/(public)/trial/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Metadata } from 'next'
import { createLead } from '@/app/actions/leads'

const schema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function TrialPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <div className="mb-4 inline-block rounded-full border border-red-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
            Danke!
          </div>
          <h1 className="mb-4 text-3xl font-black text-white">Wir melden uns bald!</h1>
          <p className="text-gray-400">
            Deine Anmeldung ist eingegangen. Unser Team kontaktiert dich innerhalb von 24 Stunden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
          Kostenlos testen · Free Trial
        </p>
        <h1 className="mb-2 text-4xl font-black text-white">1 WOCHE GRATIS</h1>
        <p className="mb-8 text-sm text-gray-500">
          Keine Anmeldegebühr · Keine Verpflichtung
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Name *
            </label>
            <input
              id="full_name"
              {...register('full_name')}
              placeholder="Dein vollständiger Name"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="deine@email.at"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Telefon (optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+43 ..."
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Nachricht (optional)
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={3}
              placeholder="Vorerfahrung, Fragen ..."
              className="w-full resize-none border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-500">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet ...' : 'Jetzt Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- trial 2>&1 | tail -10
```
Expected: 3 new tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/actions/leads.ts app/(public)/trial/
git commit -m "feat: add trial signup form with Supabase leads insert"
```

---

## Task 3: Login Page + Auth Callback

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/__tests__/LoginPage.test.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/login/__tests__/LoginPage.test.tsx`:
```typescript
// app/login/__tests__/LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '../page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

describe('LoginPage', () => {
  it('renders email input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('shows magic link mode by default', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /magic link/i })).toBeInTheDocument()
  })

  it('toggles to password mode', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText(/passwort/i))
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- login 2>&1 | tail -15
```

- [ ] **Step 3: Create `app/login/page.tsx`**

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
      setErrorMsg(error.message)
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-white">Check deine E-Mail</h2>
          <p className="text-gray-400">
            Wir haben einen Magic Link an <strong className="text-white">{email}</strong> gesendet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.jpg" alt="AXIS JIU JITSU" width={56} height={56} className="object-contain" />
        </div>

        <h1 className="mb-1 text-center text-2xl font-black text-white">AXIS Member Portal</h1>
        <p className="mb-8 text-center text-sm text-gray-600">Mitglieder-Login</p>

        {/* Mode toggle */}
        <div className="mb-6 flex border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('magic'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'magic' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'password' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Passwort
          </button>
        </div>

        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="deine@email.at"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
              />
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-red-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Wird geladen ...'
              : mode === 'magic'
              ? 'Magic Link senden →'
              : 'Einloggen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/auth/callback/route.ts`**

```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/members/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_error', origin))
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- login 2>&1 | tail -10
```
Expected: 3 new login tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/login/ app/auth/
git commit -m "feat: add login page (magic link + password) and auth callback route"
```

---

## Task 4: MemberNav Component

**Files:**
- Create: `components/members/MemberNav.tsx`
- Create: `components/members/__tests__/MemberNav.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/members/__tests__/MemberNav.test.tsx`:
```typescript
// components/members/__tests__/MemberNav.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemberNav } from '../MemberNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/members/dashboard',
}))

describe('MemberNav', () => {
  it('renders user name', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /buchen/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /gürtel/i })).toBeInTheDocument()
  })

  it('highlights the active link', () => {
    render(<MemberNav userName="Max Mustermann" />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink.className).toContain('red')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- MemberNav 2>&1 | tail -15
```

- [ ] **Step 3: Create `components/members/MemberNav.tsx`**

```typescript
// components/members/MemberNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Award, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { href: '/members/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/members/buchen', label: 'Buchen', Icon: Calendar },
  { href: '/members/g%C3%BCrtel', label: 'Gürtel', Icon: Award },
  { href: '/members/skills', label: 'Skills', Icon: BookOpen },
  { href: '/members/konto', label: 'Konto', Icon: Settings },
]

interface Props {
  userName: string
}

export function MemberNav({ userName }: Props) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#080808] lg:flex">
        <div className="border-b border-white/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">AXIS Member</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{userName}</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href || (href !== '/members/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-red-600/10 text-red-500'
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/5 bg-[#080808] lg:hidden">
        {NAV_ITEMS.slice(0, 4).map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/members/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide transition-colors',
                isActive ? 'text-red-500' : 'text-gray-600'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- MemberNav 2>&1 | tail -10
```
Expected: 3 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/MemberNav.tsx components/members/__tests__/MemberNav.test.tsx
git commit -m "feat: add MemberNav with desktop sidebar and mobile bottom tabs"
```

---

## Task 5: Member Layout

**Files:**
- Create: `app/(members)/layout.tsx`
- Create: `app/(members)/dashboard/page.tsx` (placeholder — wired up in Task 6)

- [ ] **Step 1: Create `app/(members)/layout.tsx`**

```typescript
// app/(members)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/members/MemberNav'

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email ?? 'Member'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MemberNav userName={displayName} />
      <div className="lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create placeholder `app/(members)/dashboard/page.tsx`**

```typescript
// app/(members)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white">Dashboard</h1>
      <p className="mt-2 text-gray-500">Wird geladen ...</p>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests to make sure nothing broke**

```bash
npm test 2>&1 | tail -10
```
Expected: All tests still pass.

- [ ] **Step 4: Commit**

```bash
git add app/(members)/
git commit -m "feat: add member layout with auth guard and MemberNav"
```

---

## Task 6: Member Dashboard Page

**Files:**
- Modify: `app/(members)/dashboard/page.tsx`
- Create: `components/members/NextClassCard.tsx`
- Create: `components/members/__tests__/NextClassCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/members/__tests__/NextClassCard.test.tsx`:
```typescript
// components/members/__tests__/NextClassCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NextClassCard } from '../NextClassCard'

const mockSession = {
  id: 'sess-1',
  starts_at: '2026-04-18T10:00:00.000Z',
  ends_at: '2026-04-18T11:30:00.000Z',
  class_types: { name: 'Fundamentals', gi: true, level: 'beginner' as const },
  location: 'Strindberggasse 1, 1110 Wien',
}

describe('NextClassCard', () => {
  it('renders class name', () => {
    render(<NextClassCard session={mockSession} bookingId="book-1" />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
  })

  it('renders GI badge for gi class', () => {
    render(<NextClassCard session={mockSession} bookingId="book-1" />)
    expect(screen.getByText('GI')).toBeInTheDocument()
  })

  it('renders empty state when no session', () => {
    render(<NextClassCard session={null} bookingId={null} />)
    expect(screen.getByText(/keine/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- NextClassCard 2>&1 | tail -15
```

- [ ] **Step 3: Create `components/members/NextClassCard.tsx`**

```typescript
// components/members/NextClassCard.tsx
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/utils/dates'

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
}

export function NextClassCard({ session, bookingId }: Props) {
  if (!session) {
    return (
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Nächste Klasse</p>
        <p className="mt-4 text-sm text-gray-500">Keine bevorstehende Buchung</p>
        <Link
          href="/members/buchen"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-500"
        >
          Klasse buchen →
        </Link>
      </div>
    )
  }

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Nächste Klasse</p>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{typeName}</h3>
          <p className="mt-1 text-sm text-gray-400">{formatDate(session.starts_at)}</p>
          <p className="text-sm text-gray-400">
            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          </p>
          <p className="mt-2 text-xs text-gray-600">{session.location}</p>
        </div>
        <span className={`text-xs font-black tracking-widest px-2 py-1 ${isGi ? 'bg-white/10 text-white' : 'bg-blue-900/30 text-blue-400'}`}>
          {isGi ? 'GI' : 'NO-GI'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update `app/(members)/dashboard/page.tsx` with real data**

```typescript
// app/(members)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Next upcoming session with user's confirmed booking
  const now = new Date().toISOString()
  const { data: nextSessions } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, location,
      class_types(name, gi, level),
      bookings!inner(id, profile_id, status)
    `)
    .eq('bookings.profile_id', user!.id)
    .eq('bookings.status', 'confirmed')
    .eq('cancelled', false)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(1)

  const nextSession = nextSessions?.[0] ?? null
  const bookingId = nextSession
    ? (nextSession.bookings as Array<{ id: string }>)?.[0]?.id ?? null
    : null

  // Total sessions attended
  const { count: attendanceCount } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user!.id)

  // Total confirmed bookings
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user!.id)
    .eq('status', 'confirmed')

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Next class */}
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession as never} bookingId={bookingId} />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Trainings gesamt</p>
            <p className="mt-2 text-4xl font-black text-white">{attendanceCount ?? 0}</p>
          </div>
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Aktive Buchungen</p>
            <p className="mt-2 text-4xl font-black text-white">{bookingCount ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- NextClassCard 2>&1 | tail -10
```
Expected: 3 new tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/(members)/dashboard/page.tsx components/members/NextClassCard.tsx components/members/__tests__/NextClassCard.test.tsx
git commit -m "feat: add member dashboard with next class card and attendance stats"
```

---

## Task 7: Booking Server Actions

**Files:**
- Create: `app/actions/bookings.ts`
- Create: `app/actions/__tests__/bookings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/actions/__tests__/bookings.test.ts`:
```typescript
// app/actions/__tests__/bookings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase server client
const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom, auth: { getUser: vi.fn() } }

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { bookClass, cancelBooking } from '../bookings'

describe('bookClass', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await bookClass('session-1')
    expect(result.error).toBeDefined()
  })
})

describe('cancelBooking', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await cancelBooking('booking-1')
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- actions/bookings 2>&1 | tail -15
```

- [ ] **Step 3: Create `app/actions/bookings.ts`**

```typescript
// app/actions/bookings.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookClass(sessionId: string): Promise<{ success?: boolean; status?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  // Check for existing non-cancelled booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('profile_id', user.id)
    .single()

  if (existing && existing.status !== 'cancelled') {
    return { error: 'Du hast diese Klasse bereits gebucht.' }
  }

  // Check capacity
  const [{ count: confirmedCount }, { data: session }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'confirmed'),
    supabase
      .from('class_sessions')
      .select('capacity')
      .eq('id', sessionId)
      .single(),
  ])

  const hasSpace = (confirmedCount ?? 0) < (session?.capacity ?? 20)
  const status = hasSpace ? 'confirmed' as const : 'waitlisted' as const

  let error
  if (existing) {
    // Re-activate a cancelled booking
    ;({ error } = await supabase
      .from('bookings')
      .update({ status, waitlist_position: hasSpace ? null : (confirmedCount ?? 0) + 1 })
      .eq('id', existing.id))
  } else {
    ;({ error } = await supabase
      .from('bookings')
      .insert({ session_id: sessionId, profile_id: user.id, status }))
  }

  if (error) return { error: 'Buchung fehlgeschlagen. Bitte versuche es erneut.' }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true, status }
}

export async function cancelBooking(bookingId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', waitlist_position: null })
    .eq('id', bookingId)
    .eq('profile_id', user.id)

  if (error) return { error: 'Stornierung fehlgeschlagen. Bitte versuche es erneut.' }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- actions/bookings 2>&1 | tail -10
```
Expected: 2 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/bookings.ts app/actions/__tests__/bookings.test.ts
git commit -m "feat: add bookClass and cancelBooking server actions"
```

---

## Task 8: Booking Page + ClassSlot Component

**Files:**
- Create: `components/members/ClassSlot.tsx`
- Create: `components/members/__tests__/ClassSlot.test.tsx`
- Create: `app/(members)/buchen/page.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/members/__tests__/ClassSlot.test.tsx`:
```typescript
// components/members/__tests__/ClassSlot.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ClassSlot } from '../ClassSlot'

vi.mock('@/app/actions/bookings', () => ({
  bookClass: vi.fn(),
  cancelBooking: vi.fn(),
}))

const mockSession = {
  id: 'sess-1',
  starts_at: '2026-04-18T10:00:00.000Z',
  ends_at: '2026-04-18T11:30:00.000Z',
  capacity: 20,
  location: 'Strindberggasse 1, 1110 Wien',
  class_types: { name: 'Fundamentals', gi: true, level: 'beginner' },
}

describe('ClassSlot', () => {
  it('renders class name and time', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/5\/20/)).toBeInTheDocument()
  })

  it('shows Buchen button when not booked', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} />)
    expect(screen.getByRole('button', { name: /buchen/i })).toBeInTheDocument()
  })

  it('shows Stornieren button when confirmed', () => {
    render(<ClassSlot session={mockSession} userBooking={{ id: 'b-1', status: 'confirmed' }} confirmedCount={6} />)
    expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument()
  })

  it('shows Warteliste badge when waitlisted', () => {
    render(<ClassSlot session={mockSession} userBooking={{ id: 'b-1', status: 'waitlisted' }} confirmedCount={20} />)
    expect(screen.getByText(/warteliste/i)).toBeInTheDocument()
  })

  it('shows Ausgebucht when full and no booking', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={20} />)
    expect(screen.getByText(/ausgebucht/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- ClassSlot 2>&1 | tail -15
```

- [ ] **Step 3: Create `components/members/ClassSlot.tsx`**

```typescript
// components/members/ClassSlot.tsx
'use client'

import { useState } from 'react'
import { formatTime } from '@/lib/utils/dates'
import { bookClass, cancelBooking } from '@/app/actions/bookings'

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
}

export function ClassSlot({ session, userBooking, confirmedCount }: Props) {
  const [pending, setPending] = useState(false)
  const [booking, setBooking] = useState<UserBooking | null>(userBooking)
  const [count, setCount] = useState(confirmedCount)

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true
  const isFull = count >= session.capacity

  const handleBook = async () => {
    setPending(true)
    const result = await bookClass(session.id)
    if (result.success) {
      setBooking({ id: 'pending', status: result.status === 'confirmed' ? 'confirmed' : 'waitlisted' })
      if (result.status === 'confirmed') setCount(c => c + 1)
    }
    setPending(false)
  }

  const handleCancel = async () => {
    if (!booking) return
    setPending(true)
    const result = await cancelBooking(booking.id)
    if (result.success) {
      if (booking.status === 'confirmed') setCount(c => c - 1)
      setBooking(null)
    }
    setPending(false)
  }

  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{typeName}</span>
          <span className={`text-[10px] font-black tracking-widest px-1.5 py-0.5 ${isGi ? 'bg-white/10 text-gray-400' : 'bg-blue-900/30 text-blue-400'}`}>
            {isGi ? 'GI' : 'NO-GI'}
          </span>
          {booking?.status === 'confirmed' && (
            <span className="text-[10px] font-black tracking-widest px-1.5 py-0.5 bg-green-900/30 text-green-400">
              GEBUCHT
            </span>
          )}
          {booking?.status === 'waitlisted' && (
            <span className="text-[10px] font-black tracking-widest px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400">
              WARTELISTE
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          &nbsp;·&nbsp;
          <span className={count >= session.capacity ? 'text-red-500' : ''}>
            {count}/{session.capacity}
          </span>
        </p>
      </div>

      <div className="ml-4 flex-shrink-0">
        {booking?.status === 'confirmed' || booking?.status === 'waitlisted' ? (
          <button
            onClick={handleCancel}
            disabled={pending}
            className="border border-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:border-red-600 hover:text-red-500 disabled:opacity-40"
          >
            {pending ? '...' : 'Stornieren'}
          </button>
        ) : isFull ? (
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Ausgebucht</span>
        ) : (
          <button
            onClick={handleBook}
            disabled={pending}
            className="bg-red-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            {pending ? '...' : 'Buchen'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(members)/buchen/page.tsx`**

```typescript
// app/(members)/buchen/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ClassSlot } from '@/components/members/ClassSlot'
import { getDayLabel, formatDateShort, getNextSevenDays, startOfDay, endOfDay, addDays } from '@/lib/utils/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Klassen buchen' }

export default async function BuchenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const weekStart = startOfDay(now)
  const weekEnd = endOfDay(addDays(now, 6))

  // Fetch sessions for next 7 days
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, capacity, location,
      class_types(name, gi, level),
      bookings(id, profile_id, status, waitlist_position)
    `)
    .eq('cancelled', false)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true })

  // Group sessions by day
  const days = getNextSevenDays()

  type SessionRow = NonNullable<typeof sessions>[number]
  type BookingRow = { id: string; profile_id: string; status: string; waitlist_position: number | null }

  const sessionsByDay = days.map(day => {
    const dayStr = day.toISOString().slice(0, 10)
    const daySessions = (sessions ?? []).filter(s => s.starts_at.startsWith(dayStr))
    return { day, sessions: daySessions }
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Klassen buchen</h1>

      <div className="space-y-6">
        {sessionsByDay.map(({ day, sessions: daySessions }) => (
          <div key={day.toISOString()}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {getDayLabel(day)}
              </h2>
              <span className="text-xs text-gray-600">{formatDateShort(day.toISOString())}</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            {daySessions.length === 0 ? (
              <p className="text-xs text-gray-700">Keine Klassen an diesem Tag</p>
            ) : (
              <div className="border border-white/5 bg-[#111111] px-4">
                {daySessions.map(session => {
                  const bookings = (session.bookings as BookingRow[]) ?? []
                  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
                  const userBookingRaw = bookings.find(b => b.profile_id === user!.id)
                  const userBooking = userBookingRaw && userBookingRaw.status !== 'cancelled'
                    ? { id: userBookingRaw.id, status: userBookingRaw.status as 'confirmed' | 'waitlisted' | 'cancelled' }
                    : null

                  return (
                    <ClassSlot
                      key={session.id}
                      session={session as never}
                      userBooking={userBooking}
                      confirmedCount={confirmedCount}
                    />
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- ClassSlot 2>&1 | tail -10
```
Expected: 5 new ClassSlot tests pass.

- [ ] **Step 6: Run all tests**

```bash
npm test 2>&1 | tail -10
```
Expected: All tests pass (0 failures).

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```
Fix any type errors before committing.

- [ ] **Step 8: Commit**

```bash
git add components/members/ClassSlot.tsx components/members/__tests__/ClassSlot.test.tsx app/(members)/buchen/
git commit -m "feat: add class booking page with ClassSlot component (book/cancel)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `/trial` page → Task 2
- ✅ Login (email/password + magic link) → Task 3
- ✅ Auth callback → Task 3
- ✅ `/members/dashboard` (next class, attendance count) → Tasks 5–6
- ✅ `/members/buchen` (weekly grid, book/cancel) → Tasks 7–8
- ✅ Middleware already in place from Phase 1 (redirects `/members/*` to `/login` if unauthenticated)
- ⬜ Waitlist position promotion on cancel — deferred to Phase 3 per spec ("DB trigger promotes first waitlisted")

**Placeholder scan:** No TBDs. All code complete.

**Type consistency:** `Session`, `UserBooking`, `BookingRow` types defined inline per-file. `Database` types from `types/supabase.ts` used via Supabase client inference.
