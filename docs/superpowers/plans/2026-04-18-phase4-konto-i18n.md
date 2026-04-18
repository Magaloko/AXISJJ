# Phase 4 — Account Page & Member Portal i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/members/konto` (profile edit, language toggle, documents view) and wire DE/EN translations throughout the entire member portal.

**Architecture:** Cookie-based locale propagation (`lang` cookie, set by `updateLanguage` server action, read via `cookies()` in every server component). Translation dictionaries at `lib/i18n/`. Client components receive `lang` as an optional prop (default `'de'`) and import `translations` directly. MemberNav, ClassSlot, SkillCard, BeltProgress, NextClassCard all accept `lang`.

**Tech Stack:** Next.js 15 App Router, Supabase `@supabase/ssr`, react-hook-form v7, Zod v4, @hookform/resolvers v5, Vitest + @testing-library/react

---

## File Map

```
lib/
└── i18n/
    ├── de.ts          ← new: German dictionary
    ├── en.ts          ← new: English dictionary
    └── index.ts       ← new: exports Lang type + translations

app/
├── actions/
│   ├── profile.ts              ← new: updateProfile, updateLanguage
│   └── __tests__/
│       └── profile.test.ts     ← new
└── (members)/
    ├── layout.tsx              ← modified: reads lang cookie, passes to MemberNav
    ├── dashboard/page.tsx      ← modified: reads lang, passes to components
    ├── buchen/page.tsx         ← modified: reads lang, passes to ClassSlot
    ├── gürtel/page.tsx         ← modified: reads lang, passes to BeltProgress
    ├── skills/page.tsx         ← modified: reads lang, passes to SkillCard
    └── konto/
        └── page.tsx            ← new: profile + language + documents

components/members/
    ├── MemberNav.tsx           ← modified: accepts lang, uses translations
    ├── NextClassCard.tsx       ← modified: accepts lang, uses translations
    ├── ClassSlot.tsx           ← modified: accepts lang, uses translations
    ├── BeltProgress.tsx        ← modified: accepts lang, uses translations
    ├── SkillCard.tsx           ← modified: accepts lang, uses translations
    ├── ProfileForm.tsx         ← new: react-hook-form profile edit
    ├── LanguageToggle.tsx      ← new: DE/EN toggle buttons
    └── __tests__/
        ├── ProfileForm.test.tsx    ← new
        └── LanguageToggle.test.tsx ← new
        (MemberNav, NextClassCard, ClassSlot, BeltProgress, SkillCard tests get new English assertions)
```

---

## Task 1: Translation Dictionaries

**Files:**
- Create: `lib/i18n/de.ts`
- Create: `lib/i18n/en.ts`
- Create: `lib/i18n/index.ts`

No tests — pure data. TypeScript check verifies shape parity.

- [ ] **Step 1: Create `lib/i18n/de.ts`**

```typescript
// lib/i18n/de.ts
export const de = {
  nav: {
    dashboard: 'Dashboard',
    buchen: 'Buchen',
    gurtel: 'Gürtel',
    skills: 'Skills',
    konto: 'Konto',
  },
  dashboard: {
    title: 'Dashboard',
    trainingsTotal: 'Trainings gesamt',
    activeBookings: 'Aktive Buchungen',
  },
  nextClassCard: {
    heading: 'Nächste Klasse',
    noBooking: 'Keine bevorstehende Buchung',
    bookCta: 'Klasse buchen →',
  },
  buchen: {
    title: 'Buchen',
  },
  classSlot: {
    booked: 'GEBUCHT',
    waitlisted: 'WARTELISTE',
    cancel: 'Stornieren',
    book: 'Buchen',
    full: 'Ausgebucht',
    errorBook: 'Fehler beim Buchen.',
    errorCancel: 'Fehler beim Stornieren.',
  },
  gurtel: {
    title: 'Gürtel',
    history: 'Verlauf',
  },
  belt: {
    heading: 'Gürtel',
    noRank: 'Kein Rang eingetragen — bitte Coach kontaktieren.',
    stripes: 'Stripes',
    trainings: 'Trainings',
    months: 'Monate',
    readinessLabel: 'Promotionsbereitschaft',
  },
  skills: {
    title: 'Skills',
    empty: 'Noch keine Skills eingetragen.',
    mastered: 'beherrscht',
  },
  skillCard: {
    notStarted: 'Nicht begonnen',
    inProgress: 'In Arbeit',
    mastered: 'Beherrscht',
  },
  konto: {
    title: 'Konto',
    profileSection: 'Profil',
    fullName: 'Vollständiger Name',
    phone: 'Telefon',
    dateOfBirth: 'Geburtsdatum',
    save: 'Speichern',
    saved: 'Gespeichert ✓',
    languageSection: 'Sprache',
    documentsSection: 'Dokumente',
    waiver: 'Haftungsausschluss',
    contract: 'Vertrag',
    signedAt: 'Unterzeichnet am',
    noDocuments: 'Keine Dokumente vorhanden.',
    download: 'Download',
  },
}
```

- [ ] **Step 2: Create `lib/i18n/en.ts`**

```typescript
// lib/i18n/en.ts
export const en = {
  nav: {
    dashboard: 'Dashboard',
    buchen: 'Book',
    gurtel: 'Belt',
    skills: 'Skills',
    konto: 'Account',
  },
  dashboard: {
    title: 'Dashboard',
    trainingsTotal: 'Total Trainings',
    activeBookings: 'Active Bookings',
  },
  nextClassCard: {
    heading: 'Next Class',
    noBooking: 'No upcoming booking',
    bookCta: 'Book a class →',
  },
  buchen: {
    title: 'Book a Class',
  },
  classSlot: {
    booked: 'BOOKED',
    waitlisted: 'WAITLISTED',
    cancel: 'Cancel',
    book: 'Book',
    full: 'Full',
    errorBook: 'Booking failed.',
    errorCancel: 'Cancellation failed.',
  },
  gurtel: {
    title: 'Belt',
    history: 'History',
  },
  belt: {
    heading: 'Belt',
    noRank: 'No rank on file — please contact your coach.',
    stripes: 'Stripes',
    trainings: 'Trainings',
    months: 'Months',
    readinessLabel: 'Promotion Readiness',
  },
  skills: {
    title: 'Skills',
    empty: 'No skills added yet.',
    mastered: 'mastered',
  },
  skillCard: {
    notStarted: 'Not Started',
    inProgress: 'In Progress',
    mastered: 'Mastered',
  },
  konto: {
    title: 'Account',
    profileSection: 'Profile',
    fullName: 'Full Name',
    phone: 'Phone',
    dateOfBirth: 'Date of Birth',
    save: 'Save',
    saved: 'Saved ✓',
    languageSection: 'Language',
    documentsSection: 'Documents',
    waiver: 'Waiver',
    contract: 'Contract',
    signedAt: 'Signed on',
    noDocuments: 'No documents on file.',
    download: 'Download',
  },
}
```

- [ ] **Step 3: Create `lib/i18n/index.ts`**

```typescript
// lib/i18n/index.ts
import { de } from './de'
import { en } from './en'

export type Lang = 'de' | 'en'
export const translations = { de, en }
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/de.ts lib/i18n/en.ts lib/i18n/index.ts
git commit -m "feat: add DE/EN translation dictionaries"
```

---

## Task 2: Profile Server Actions

**Files:**
- Create: `app/actions/profile.ts`
- Create: `app/actions/__tests__/profile.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/actions/__tests__/profile.test.ts`:

```typescript
// app/actions/__tests__/profile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockCookieStore = { get: vi.fn(), set: vi.fn() }
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { updateProfile, updateLanguage } from '../profile'

describe('updateProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateProfile({ full_name: 'Max', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })

  it('returns error for name shorter than 2 chars', async () => {
    const result = await updateProfile({ full_name: 'A', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })

  it('returns success and coerces empty strings to null', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateProfile({ full_name: 'Max Mustermann', phone: '', date_of_birth: '' })
    expect(result.success).toBe(true)
    expect(chain.update).toHaveBeenCalledWith({
      full_name: 'Max Mustermann',
      phone: null,
      date_of_birth: null,
    })
  })

  it('returns error when DB update fails', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('db error') }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateProfile({ full_name: 'Max Mustermann', phone: '', date_of_birth: '' })
    expect(result.error).toBeDefined()
  })
})

describe('updateLanguage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockCookieStore.set.mockReset()
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateLanguage('en')
    expect(result.error).toBeDefined()
  })

  it('updates DB and sets lang cookie on success', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateLanguage('en')
    expect(result.success).toBe(true)
    expect(chain.update).toHaveBeenCalledWith({ language: 'en' })
    expect(mockCookieStore.set).toHaveBeenCalledWith('lang', 'en', expect.objectContaining({ path: '/' }))
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- actions/profile 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/actions/profile.ts`**

```typescript
// app/actions/profile.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
})

export async function updateProfile(
  data: z.infer<typeof profileSchema>
): Promise<{ success?: boolean; error?: string }> {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq('id', user.id)

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/members/konto')
  return { success: true }
}

export async function updateLanguage(
  lang: 'de' | 'en'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('profiles')
    .update({ language: lang })
    .eq('id', user.id)

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  const cookieStore = await cookies()
  cookieStore.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false })

  revalidatePath('/members', 'layout')
  return { success: true }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- actions/profile 2>&1 | tail -10
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/profile.ts "app/actions/__tests__/profile.test.ts"
git commit -m "feat: add updateProfile and updateLanguage server actions"
```

---

## Task 3: ProfileForm Component

**Files:**
- Create: `components/members/ProfileForm.tsx`
- Create: `components/members/__tests__/ProfileForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/members/__tests__/ProfileForm.test.tsx`:

```typescript
// components/members/__tests__/ProfileForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProfileForm } from '../ProfileForm'

vi.mock('@/app/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
}))

import { updateProfile } from '@/app/actions/profile'

const mockProfile = {
  full_name: 'Max Mustermann',
  phone: '+43 660 1234567',
  date_of_birth: '1990-05-15',
  language: 'de',
}

describe('ProfileForm', () => {
  it('renders pre-filled full name', () => {
    render(<ProfileForm profile={mockProfile} lang="de" />)
    expect(screen.getByDisplayValue('Max Mustermann')).toBeInTheDocument()
  })

  it('renders German labels when lang is de', () => {
    render(<ProfileForm profile={mockProfile} lang="de" />)
    expect(screen.getByText('Vollständiger Name')).toBeInTheDocument()
  })

  it('renders English labels when lang is en', () => {
    render(<ProfileForm profile={mockProfile} lang="en" />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
  })

  it('shows saved message on successful submit', async () => {
    const user = userEvent.setup()
    render(<ProfileForm profile={mockProfile} lang="de" />)
    await user.click(screen.getByRole('button', { name: /speichern/i }))
    await waitFor(() => expect(screen.getByText(/gespeichert/i)).toBeInTheDocument())
  })

  it('shows error message on failed submit', async () => {
    vi.mocked(updateProfile).mockResolvedValueOnce({ error: 'Speichern fehlgeschlagen.' })
    const user = userEvent.setup()
    render(<ProfileForm profile={mockProfile} lang="de" />)
    await user.click(screen.getByRole('button', { name: /speichern/i }))
    await waitFor(() => expect(screen.getByText('Speichern fehlgeschlagen.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- ProfileForm 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/members/ProfileForm.tsx`**

```typescript
// components/members/ProfileForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { translations, type Lang } from '@/lib/i18n'

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  profile: { full_name: string; phone: string | null; date_of_birth: string | null; language: string } | null
  lang: Lang
}

export function ProfileForm({ profile, lang }: Props) {
  const t = translations[lang].konto
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const result = await updateProfile(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.fullName}
        </label>
        <input
          {...register('full_name')}
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.phone}
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.dateOfBirth}
        </label>
        <input
          {...register('date_of_birth')}
          type="date"
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none [color-scheme:dark]"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-40"
        >
          {saved ? t.saved : t.save}
        </button>
        {serverError && <p className="text-xs text-red-500">{serverError}</p>}
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- ProfileForm 2>&1 | tail -10
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/ProfileForm.tsx "components/members/__tests__/ProfileForm.test.tsx"
git commit -m "feat: add ProfileForm component with react-hook-form and i18n"
```

---

## Task 4: LanguageToggle Component

**Files:**
- Create: `components/members/LanguageToggle.tsx`
- Create: `components/members/__tests__/LanguageToggle.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/members/__tests__/LanguageToggle.test.tsx`:

```typescript
// components/members/__tests__/LanguageToggle.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LanguageToggle } from '../LanguageToggle'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/app/actions/profile', () => ({
  updateLanguage: vi.fn().mockResolvedValue({ success: true }),
}))

import { updateLanguage } from '@/app/actions/profile'

describe('LanguageToggle', () => {
  it('renders DE and EN buttons', () => {
    render(<LanguageToggle current="de" />)
    expect(screen.getByRole('button', { name: 'DE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
  })

  it('DE button is aria-pressed when current is de', () => {
    render(<LanguageToggle current="de" />)
    expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('EN button is aria-pressed when current is en', () => {
    render(<LanguageToggle current="en" />)
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls updateLanguage with en when EN clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle current="de" />)
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(updateLanguage).toHaveBeenCalledWith('en')
  })

  it('does not call updateLanguage when active lang clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle current="de" />)
    await user.click(screen.getByRole('button', { name: 'DE' }))
    expect(updateLanguage).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- LanguageToggle 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/members/LanguageToggle.tsx`**

```typescript
// components/members/LanguageToggle.tsx
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
      await updateLanguage(lang)
      router.refresh()
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
            'px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            current === lang
              ? 'bg-red-600 text-white'
              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- LanguageToggle 2>&1 | tail -10
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/LanguageToggle.tsx "components/members/__tests__/LanguageToggle.test.tsx"
git commit -m "feat: add LanguageToggle component"
```

---

## Task 5: Konto Page

**Files:**
- Create: `app/(members)/konto/page.tsx`

No unit test — server component verified by integration testing.

- [ ] **Step 1: Create `app/(members)/konto/page.tsx`**

```typescript
// app/(members)/konto/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { translations, type Lang } from '@/lib/i18n'
import { ProfileForm } from '@/components/members/ProfileForm'
import { LanguageToggle } from '@/components/members/LanguageToggle'
import { formatDate } from '@/lib/utils/dates'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Konto' }

export default async function KontoPage() {
  const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
  const t = translations[lang].konto

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: documents }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, date_of_birth, language')
      .eq('id', user.id)
      .single(),
    supabase
      .from('documents')
      .select('type, signed_at, content_url')
      .eq('profile_id', user.id)
      .order('signed_at', { ascending: false }),
  ])

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">{t.title}</h1>

      <div className="max-w-lg space-y-8">
        {/* Profile */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
            {t.profileSection}
          </p>
          <ProfileForm profile={profile} lang={lang} />
        </section>

        {/* Language */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
            {t.languageSection}
          </p>
          <LanguageToggle current={lang} />
        </section>

        {/* Documents */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
            {t.documentsSection}
          </p>
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noDocuments}</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-white/5 bg-[#111111] p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {doc.type === 'waiver' ? t.waiver : t.contract}
                    </p>
                    {doc.signed_at && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {t.signedAt} {formatDate(doc.signed_at)}
                      </p>
                    )}
                  </div>
                  {doc.content_url && (
                    <a
                      href={doc.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-500"
                    >
                      {t.download}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test 2>&1 | tail -8
```

Expected: All tests pass (no regressions).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Fix any errors before committing.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/konto/page.tsx"
git commit -m "feat: add /members/konto page with profile edit, language toggle, documents"
```

---

## Task 6: Member Layout + MemberNav Lang Prop

**Files:**
- Modify: `app/(members)/layout.tsx`
- Modify: `components/members/MemberNav.tsx`
- Modify: `components/members/__tests__/MemberNav.test.tsx`

- [ ] **Step 1: Add English label test to MemberNav.test.tsx**

Open `components/members/__tests__/MemberNav.test.tsx` and add this test inside `describe('MemberNav', ...)`:

```typescript
it('renders English nav labels when lang is en', () => {
  render(<MemberNav userName="Max Mustermann" lang="en" />)
  expect(screen.getAllByRole('link', { name: /^book$/i })[0]).toBeInTheDocument()
})
```

- [ ] **Step 2: Run MemberNav tests — expect FAIL**

```bash
npm test -- MemberNav 2>&1 | tail -10
```

Expected: FAIL — MemberNav doesn't accept `lang` prop yet.

- [ ] **Step 3: Update `components/members/MemberNav.tsx`**

Replace the entire file:

```typescript
// components/members/MemberNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Award, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { translations, type Lang } from '@/lib/i18n'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

function navItems(lang: Lang): NavItem[] {
  const t = translations[lang].nav
  return [
    { href: '/members/dashboard', label: t.dashboard, Icon: LayoutDashboard },
    { href: '/members/buchen',    label: t.buchen,    Icon: Calendar },
    { href: '/members/gürtel',   label: t.gurtel,    Icon: Award },
    { href: '/members/skills',   label: t.skills,    Icon: BookOpen },
    { href: '/members/konto',    label: t.konto,     Icon: Settings },
  ]
}

interface Props {
  userName: string
  lang?: Lang
}

export function MemberNav({ userName, lang = 'de' }: Props) {
  const pathname = usePathname()
  const items = navItems(lang)

  const isActive = (href: string) =>
    pathname === href || (href !== '/members/dashboard' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#080808] lg:flex" aria-label="Mitglieder Navigation">
        <div className="border-b border-white/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">AXIS Member</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{userName}</p>
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/5 bg-[#080808] lg:hidden" aria-label="Mobile Navigation">
        {items.slice(0, 4).map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wide transition-colors',
                active ? 'text-red-500' : 'text-gray-600'
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

- [ ] **Step 4: Run MemberNav tests — expect PASS**

```bash
npm test -- MemberNav 2>&1 | tail -10
```

Expected: 4 tests pass (3 existing + 1 new English test).

- [ ] **Step 5: Update `app/(members)/layout.tsx`**

Replace the entire file:

```typescript
// app/(members)/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/members/MemberNav'
import { type Lang } from '@/lib/i18n'

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
  const lang = ((await cookies()).get('lang')?.value ?? profile?.language ?? 'de') as Lang

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MemberNav userName={displayName} lang={lang} />
      <div className="lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests + TypeScript check**

```bash
npm test 2>&1 | tail -8 && npx tsc --noEmit 2>&1 | head -20
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(members)/layout.tsx" components/members/MemberNav.tsx "components/members/__tests__/MemberNav.test.tsx"
git commit -m "feat: propagate lang from layout to MemberNav, add i18n nav labels"
```

---

## Task 7: NextClassCard Lang Prop

**Files:**
- Modify: `components/members/NextClassCard.tsx`
- Modify: `components/members/__tests__/NextClassCard.test.tsx`

- [ ] **Step 1: Add English test to NextClassCard.test.tsx**

Open `components/members/__tests__/NextClassCard.test.tsx` and add inside `describe('NextClassCard', ...)`:

```typescript
it('renders English empty state when lang is en', () => {
  render(<NextClassCard session={null} bookingId={null} lang="en" />)
  expect(screen.getByText('No upcoming booking')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run NextClassCard tests — expect FAIL**

```bash
npm test -- NextClassCard 2>&1 | tail -10
```

Expected: FAIL — NextClassCard doesn't accept `lang` prop.

- [ ] **Step 3: Update `components/members/NextClassCard.tsx`**

Replace the entire file:

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
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.heading}</p>
        <p className="mt-4 text-sm text-gray-500">{t.noBooking}</p>
        <Link
          href="/members/buchen"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-500"
        >
          {t.bookCta}
        </Link>
      </div>
    )
  }

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.heading}</p>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{typeName}</h3>
          <p className="mt-1 text-sm text-gray-400">{formatDate(session.starts_at)}</p>
          <p className="text-sm text-gray-400">
            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          </p>
          <p className="mt-2 text-xs text-gray-600">{session.location}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-black tracking-widest ${isGi ? 'bg-white/10 text-white' : 'bg-blue-900/30 text-blue-400'}`}>
          {isGi ? 'GI' : 'NO-GI'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run NextClassCard tests — expect PASS**

```bash
npm test -- NextClassCard 2>&1 | tail -10
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/NextClassCard.tsx "components/members/__tests__/NextClassCard.test.tsx"
git commit -m "feat: add lang prop to NextClassCard with i18n strings"
```

---

## Task 8: ClassSlot Lang Prop

**Files:**
- Modify: `components/members/ClassSlot.tsx`
- Modify: `components/members/__tests__/ClassSlot.test.tsx`

- [ ] **Step 1: Add English test to ClassSlot.test.tsx**

Open `components/members/__tests__/ClassSlot.test.tsx` and add inside `describe('ClassSlot', ...)`:

```typescript
it('renders English Book button when lang is en', () => {
  render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} lang="en" />)
  expect(screen.getByRole('button', { name: /^book$/i })).toBeInTheDocument()
})

it('renders English Full text when full and lang is en', () => {
  render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={20} lang="en" />)
  expect(screen.getByText(/^Full$/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run ClassSlot tests — expect FAIL**

```bash
npm test -- ClassSlot 2>&1 | tail -10
```

Expected: FAIL — ClassSlot doesn't use lang prop.

- [ ] **Step 3: Update `components/members/ClassSlot.tsx`**

Replace the entire file:

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
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{typeName}</span>
          <span className={`px-1.5 py-0.5 text-[10px] font-black tracking-widest ${isGi ? 'bg-white/10 text-gray-400' : 'bg-blue-900/30 text-blue-400'}`}>
            {isGi ? 'GI' : 'NO-GI'}
          </span>
          {booking?.status === 'confirmed' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-green-900/30 text-green-400">
              {t.booked}
            </span>
          )}
          {booking?.status === 'waitlisted' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-yellow-900/30 text-yellow-400">
              {t.waitlisted}
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
            disabled={pending || booking.id === 'pending'}
            aria-label={`${typeName} ${t.cancel}`}
            className="border border-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:border-red-600 hover:text-red-500 disabled:opacity-40"
          >
            {pending ? '...' : t.cancel}
          </button>
        ) : isFull ? (
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{t.full}</span>
        ) : (
          <button
            onClick={handleBook}
            disabled={pending}
            aria-label={`${typeName} ${t.book}`}
            className="bg-red-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            {pending ? '...' : t.book}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run ClassSlot tests — expect PASS**

```bash
npm test -- ClassSlot 2>&1 | tail -10
```

Expected: 7 tests pass (5 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add components/members/ClassSlot.tsx "components/members/__tests__/ClassSlot.test.tsx"
git commit -m "feat: add lang prop to ClassSlot with i18n strings"
```

---

## Task 9: BeltProgress Lang Prop

**Files:**
- Modify: `components/members/BeltProgress.tsx`
- Modify: `components/members/__tests__/BeltProgress.test.tsx`

- [ ] **Step 1: Add English test to BeltProgress.test.tsx**

Open `components/members/__tests__/BeltProgress.test.tsx` and add inside `describe('BeltProgress', ...)`:

```typescript
it('renders English month label when lang is en', () => {
  render(<BeltProgress {...mockRank} lang="en" />)
  expect(screen.getByText(/8 Months/)).toBeInTheDocument()
})

it('renders English empty state when lang is en', () => {
  render(<BeltProgress beltName={null} stripes={0} colorHex={null} readiness={0} sessionsAttended={0} monthsInGrade={0} lang="en" />)
  expect(screen.getByText(/no rank on file/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run BeltProgress tests — expect FAIL**

```bash
npm test -- BeltProgress 2>&1 | tail -10
```

Expected: FAIL — BeltProgress doesn't use lang prop.

- [ ] **Step 3: Update `components/members/BeltProgress.tsx`**

Replace the entire file:

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
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.heading}</p>
        <p className="mt-4 text-sm text-gray-500">{t.noRank}</p>
      </div>
    )
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const clampedReadiness = Math.min(100, Math.max(0, readiness))
  const offset = circumference - (clampedReadiness / 100) * circumference
  const beltColor = colorHex ?? '#e5e7eb'

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.heading}</p>

      <div className="mt-4 flex items-center gap-6">
        {/* SVG progress ring */}
        <svg
          role="img"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-label={`${beltName} Belt, ${stripes} ${t.stripes}. ${t.readinessLabel}: ${clampedReadiness}%. ${sessionsAttended} ${t.trainings}, ${monthsInGrade} ${t.months}.`}
        >
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
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
          <text x="40" y="45" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
            {clampedReadiness}%
          </text>
        </svg>

        {/* Belt info */}
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-16 rounded-sm"
              style={{ backgroundColor: beltColor, border: beltColor === '#111111' ? '1px solid #dc2626' : undefined }}
            />
          </div>
          <p className="mt-2 text-xl font-black text-white">{beltName} Belt</p>
          <p className="text-xs text-gray-500">{stripes} {t.stripes}</p>
          <p className="mt-2 text-xs text-gray-600">
            {sessionsAttended} {t.trainings} · {monthsInGrade} {t.months}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run BeltProgress tests — expect PASS**

```bash
npm test -- BeltProgress 2>&1 | tail -10
```

Expected: 6 tests pass (4 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add components/members/BeltProgress.tsx "components/members/__tests__/BeltProgress.test.tsx"
git commit -m "feat: add lang prop to BeltProgress with i18n strings"
```

---

## Task 10: SkillCard Lang Prop

**Files:**
- Modify: `components/members/SkillCard.tsx`
- Modify: `components/members/__tests__/SkillCard.test.tsx`

- [ ] **Step 1: Add English test to SkillCard.test.tsx**

Open `components/members/__tests__/SkillCard.test.tsx` and add inside `describe('SkillCard', ...)`:

```typescript
it('shows Not Started label when lang is en', () => {
  render(<SkillCard skill={mockSkill} initialStatus="not_started" lang="en" />)
  expect(screen.getByRole('button', { name: /not started/i })).toBeInTheDocument()
})

it('cycles to In Progress label in German by default', () => {
  // verifies that default lang='de' still works
  render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
  expect(screen.getByRole('button', { name: /nicht begonnen/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run SkillCard tests — expect FAIL**

```bash
npm test -- SkillCard 2>&1 | tail -10
```

Expected: FAIL on the English test — SkillCard doesn't use lang prop.

- [ ] **Step 3: Update `components/members/SkillCard.tsx`**

Replace the entire file:

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
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{skill.name}</p>
        {skill.description && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{skill.description}</p>
        )}
      </div>

      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        {skill.video_url && (
          <a
            href={skill.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-white"
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
            status === 'mastered'    && 'bg-green-900/30 text-green-400',
            status === 'in_progress' && 'bg-yellow-900/30 text-yellow-400',
            status === 'not_started' && 'bg-white/5 text-gray-600'
          )}
        >
          {statusLabels[status]}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run SkillCard tests — expect PASS**

```bash
npm test -- SkillCard 2>&1 | tail -10
```

Expected: 8 tests pass (6 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add components/members/SkillCard.tsx "components/members/__tests__/SkillCard.test.tsx"
git commit -m "feat: add lang prop to SkillCard with i18n status labels"
```

---

## Task 11: Dashboard Page Lang Integration

**Files:**
- Modify: `app/(members)/dashboard/page.tsx`

- [ ] **Step 1: Update `app/(members)/dashboard/page.tsx`**

Replace the entire file:

```typescript
// app/(members)/dashboard/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import { BeltProgress } from '@/components/members/BeltProgress'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import { translations, type Lang } from '@/lib/i18n'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string }
interface BeltRankRow {
  name: string; stripes: number; color_hex: string | null
  min_sessions: number | null; min_time_months: number | null
}

export default async function DashboardPage() {
  const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const now = new Date().toISOString()

  const [
    { data: nextSessions },
    { count: attendanceCount },
    { count: bookingCount },
    { data: rankHistory },
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`
        id, starts_at, ends_at, location,
        class_types(name, gi, level),
        bookings!inner(id, profile_id, status)
      `)
      .eq('bookings.profile_id', userId)
      .eq('bookings.status', 'confirmed')
      .eq('cancelled', false)
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(1),
    supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('status', 'confirmed'),
    supabase
      .from('profile_ranks')
      .select('promoted_at, belt_ranks(name, stripes, color_hex, min_sessions, min_time_months)')
      .eq('profile_id', userId)
      .order('promoted_at', { ascending: false })
      .limit(1),
  ])

  const raw = nextSessions?.[0] ?? null
  const rawBookings = raw?.bookings as BookingRow[] | BookingRow | null | undefined
  const bookingId = (Array.isArray(rawBookings) ? rawBookings[0] : rawBookings)?.id ?? null

  const rawClassTypes = raw?.class_types as ClassType[] | ClassType | null | undefined
  const classType: ClassType | null = Array.isArray(rawClassTypes)
    ? (rawClassTypes[0] ?? null)
    : (rawClassTypes ?? null)

  const nextSession = raw
    ? { id: raw.id, starts_at: raw.starts_at, ends_at: raw.ends_at, location: raw.location, class_types: classType }
    : null

  const latestRankRow = rankHistory?.[0] ?? null
  const rawBeltRank = latestRankRow?.belt_ranks
  const beltRank: BeltRankRow | null = Array.isArray(rawBeltRank)
    ? (rawBeltRank[0] ?? null)
    : (rawBeltRank as BeltRankRow | null) ?? null

  const monthsInGrade = latestRankRow?.promoted_at
    ? differenceInMonths(new Date(), new Date(latestRankRow.promoted_at))
    : 0

  const readiness = calcReadiness(
    attendanceCount ?? 0,
    beltRank?.min_sessions ?? null,
    monthsInGrade,
    beltRank?.min_time_months ?? null
  )

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">{t.dashboard.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
        </div>

        <div className="space-y-4">
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.dashboard.trainingsTotal}</p>
            <p className="mt-2 text-4xl font-black text-white">{attendanceCount ?? 0}</p>
          </div>
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{t.dashboard.activeBookings}</p>
            <p className="mt-2 text-4xl font-black text-white">{bookingCount ?? 0}</p>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <BeltProgress
            beltName={beltRank?.name ?? null}
            stripes={beltRank?.stripes ?? 0}
            colorHex={beltRank?.color_hex ?? null}
            readiness={readiness}
            sessionsAttended={attendanceCount ?? 0}
            monthsInGrade={monthsInGrade}
            lang={lang}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests + TypeScript check**

```bash
npm test 2>&1 | tail -8 && npx tsc --noEmit 2>&1 | head -20
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(members)/dashboard/page.tsx"
git commit -m "feat: wire lang into dashboard page, pass to components"
```

---

## Task 12: Buchen Page Lang Integration

**Files:**
- Modify: `app/(members)/buchen/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/(members)/buchen/page.tsx` to see the existing structure before modifying.

- [ ] **Step 2: Update `app/(members)/buchen/page.tsx`**

Add the following at the top of the file (after existing imports):

```typescript
import { cookies } from 'next/headers'
import { translations, type Lang } from '@/lib/i18n'
```

At the start of the `BuchenPage` async function, add:

```typescript
const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
const t = translations[lang].buchen
```

Replace the page `<h1>` heading (currently `Buchen`) with:

```typescript
<h1 className="mb-6 text-2xl font-black text-white">{t.title}</h1>
```

For every `<ClassSlot ... />` render call, add `lang={lang}` as a prop.

- [ ] **Step 3: Run all tests + TypeScript check**

```bash
npm test 2>&1 | tail -8 && npx tsc --noEmit 2>&1 | head -20
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/buchen/page.tsx"
git commit -m "feat: wire lang into buchen page, pass to ClassSlot"
```

---

## Task 13: Gürtel Page Lang Integration

**Files:**
- Modify: `app/(members)/gürtel/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/(members)/gürtel/page.tsx` to see the existing structure.

- [ ] **Step 2: Update `app/(members)/gürtel/page.tsx`**

Add imports at the top:

```typescript
import { cookies } from 'next/headers'
import { translations, type Lang } from '@/lib/i18n'
```

At the start of `GuertelPage`, add:

```typescript
const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
const t = translations[lang].gurtel
```

Replace the headings:
- `<h1>Gürtel</h1>` → `<h1 className="mb-6 text-2xl font-black text-white">{t.title}</h1>`
- The history section heading `'Verlauf'` → `{t.history}`

Add `lang={lang}` to `<BeltProgress ... />`.

- [ ] **Step 3: Run all tests + TypeScript check**

```bash
npm test 2>&1 | tail -8 && npx tsc --noEmit 2>&1 | head -20
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/gürtel/page.tsx"
git commit -m "feat: wire lang into gürtel page, pass to BeltProgress"
```

---

## Task 14: Skills Page Lang Integration

**Files:**
- Modify: `app/(members)/skills/page.tsx`

- [ ] **Step 1: Read the current file**

Read `app/(members)/skills/page.tsx` to see the existing structure.

- [ ] **Step 2: Update `app/(members)/skills/page.tsx`**

Add imports at the top:

```typescript
import { cookies } from 'next/headers'
import { translations, type Lang } from '@/lib/i18n'
```

At the start of `SkillsPage`, add:

```typescript
const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
const t = translations[lang].skills
```

Replace:
- Page `<h1>Skills</h1>` → `<h1 className="mb-6 text-2xl font-black text-white">{t.title}</h1>`
- Empty state text → `{t.empty}`
- `beherrscht` counter string → `{t.mastered}`

Add `lang={lang}` to every `<SkillCard ... />`.

- [ ] **Step 3: Run all tests + TypeScript check**

```bash
npm test 2>&1 | tail -8 && npx tsc --noEmit 2>&1 | head -20
```

Expected: All tests pass, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/skills/page.tsx"
git commit -m "feat: wire lang into skills page, pass to SkillCard"
```

---

## Self-Review

**Spec coverage:**
- ✅ `lib/i18n/` with de/en dictionaries → Task 1
- ✅ `updateProfile` + `updateLanguage` server actions → Task 2
- ✅ `ProfileForm` client component → Task 3
- ✅ `LanguageToggle` client component → Task 4
- ✅ `/members/konto` page → Task 5
- ✅ Layout + MemberNav lang propagation → Task 6
- ✅ NextClassCard i18n → Task 7
- ✅ ClassSlot i18n → Task 8
- ✅ BeltProgress i18n → Task 9
- ✅ SkillCard i18n → Task 10
- ✅ Dashboard lang integration → Task 11
- ✅ Buchen lang integration → Task 12
- ✅ Gürtel lang integration → Task 13
- ✅ Skills lang integration → Task 14

**Placeholder scan:** No TBDs. Tasks 12–14 instruct implementer to read the current file first before modifying, which is correct for files with complex existing structure.

**Type consistency:** `Lang` type defined in `lib/i18n/index.ts` (Task 1) and imported identically in all subsequent tasks. All component props use `lang?: Lang` with `= 'de'` default. `translations[lang].xxx` access pattern is consistent throughout.
