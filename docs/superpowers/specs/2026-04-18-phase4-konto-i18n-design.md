# Phase 4 — Account Page & Member Portal i18n

## Goal

Add `/members/konto` (profile edit, language toggle, documents view) and wire DE/EN translations throughout the entire member portal. Language preference is stored in `profiles.language` and propagated via a `lang` cookie.

---

## Architecture

### Locale propagation

- **Cookie name:** `lang` — values `'de'` | `'en'`, default `'de'`, 1-year expiry, `httpOnly: false` so the `LanguageToggle` client component can read the active state optimistically.
- **Server components** read the cookie: `const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang`
- **Client components** receive `lang` as a prop from their nearest server-component parent. They import `translations` directly from `@/lib/i18n` — the dictionary is tiny (<2 KB) and fine to ship to the browser.
- `updateLanguage` sets the cookie server-side, updates `profiles.language`, and calls `revalidatePath('/members', 'layout')` to invalidate the entire member subtree. The `LanguageToggle` component calls `router.refresh()` after the action completes to force an immediate re-render.

### Type

```ts
export type Lang = 'de' | 'en'
```

---

## File Map

```
lib/
└── i18n/
    ├── de.ts          — German dictionary
    ├── en.ts          — English dictionary
    └── index.ts       — exports Lang type + translations object

app/
├── actions/
│   └── profile.ts     — updateProfile, updateLanguage server actions
└── (members)/
    └── konto/
        └── page.tsx   — server component: fetches profile + documents

components/
└── members/
    ├── ProfileForm.tsx     — client form (react-hook-form + Zod)
    └── LanguageToggle.tsx  — client DE/EN toggle button pair
```

**Modified files:**
- `app/(members)/layout.tsx` — reads cookie, passes `lang` to `MemberNav`
- `components/members/MemberNav.tsx` — accepts `lang` prop, uses translations
- `app/(members)/dashboard/page.tsx` — reads cookie, passes `lang` to `NextClassCard` + `BeltProgress`
- `components/members/NextClassCard.tsx` — accepts `lang` prop, uses translations
- `app/(members)/buchen/page.tsx` — reads cookie, passes `lang` to `ClassSlot`
- `components/members/ClassSlot.tsx` — accepts `lang` prop, uses translations
- `app/(members)/gürtel/page.tsx` — reads cookie, passes `lang` to `BeltProgress`
- `components/members/BeltProgress.tsx` — accepts `lang` prop, uses translations
- `app/(members)/skills/page.tsx` — reads cookie, passes `lang` to `SkillCard`
- `components/members/SkillCard.tsx` — accepts `lang` prop, uses translations

---

## Translation Dictionaries

Both `de.ts` and `en.ts` export a same-shape object. `index.ts` exports `translations = { de, en }` and `type Lang`.

### `lib/i18n/de.ts`

```ts
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

### `lib/i18n/en.ts`

```ts
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

### `lib/i18n/index.ts`

```ts
import { de } from './de'
import { en } from './en'

export type Lang = 'de' | 'en'
export const translations = { de, en }
```

---

## Server Actions — `app/actions/profile.ts`

```ts
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
      phone: parsed.data.phone || null,           // coerce '' → null
      date_of_birth: parsed.data.date_of_birth || null, // coerce '' → null
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

---

## Konto Page — `app/(members)/konto/page.tsx`

Server component. Fetches profile + documents. Reads `lang` cookie. Passes `lang` to child client components.

```ts
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
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">{t.profileSection}</p>
          <ProfileForm profile={profile} lang={lang} />
        </section>

        {/* Language */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">{t.languageSection}</p>
          <LanguageToggle current={lang} />
        </section>

        {/* Documents */}
        <section>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">{t.documentsSection}</p>
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noDocuments}</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between border border-white/5 bg-[#111111] p-4">
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

---

## ProfileForm Component — `components/members/ProfileForm.tsx`

Client component. react-hook-form + Zod. Pre-fills from profile. Shows inline success/error.

**Props:**
```ts
interface Props {
  profile: { full_name: string; phone: string | null; date_of_birth: string | null; language: string } | null
  lang: Lang
}
```

**Zod schema:**
```ts
const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
})
```

**Behaviour:** On submit, calls `updateProfile`. On success sets `saved = true` (shows `t.saved` for 2 seconds then resets). On error shows error string below button.

---

## LanguageToggle Component — `components/members/LanguageToggle.tsx`

Client component. Two buttons: `DE` | `EN`. Active one has `bg-red-600 text-white`, inactive has `bg-white/5 text-gray-500`. On click calls `updateLanguage(lang)` then `router.refresh()`.

**Props:** `current: Lang`

---

## Member Layout — `app/(members)/layout.tsx`

Add cookie read + pass `lang` to `MemberNav`:

```ts
const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
// pass to MemberNav
<MemberNav userName={profile.full_name} lang={lang} />
```

---

## MemberNav Changes

Add `lang: Lang` to props. Replace hardcoded German labels with `translations[lang].nav.*`.

```ts
const NAV_ITEMS = (lang: Lang): NavItem[] => [
  { href: '/members/dashboard', label: translations[lang].nav.dashboard, Icon: LayoutDashboard },
  { href: '/members/buchen',    label: translations[lang].nav.buchen,    Icon: Calendar },
  { href: '/members/gürtel',   label: translations[lang].nav.gurtel,    Icon: Award },
  { href: '/members/skills',   label: translations[lang].nav.skills,    Icon: BookOpen },
  { href: '/members/konto',    label: translations[lang].nav.konto,     Icon: Settings },
]
```

---

## Dashboard Page Changes

Read cookie, pass `lang` to `NextClassCard` and `BeltProgress`:

```ts
const lang = ((await cookies()).get('lang')?.value ?? 'de') as Lang
const t = translations[lang].dashboard
// ...
<p>{t.trainingsTotal}</p>
<p>{t.activeBookings}</p>
<NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
<BeltProgress ... lang={lang} />
```

---

## NextClassCard Changes

Add `lang: Lang` prop. Replace hardcoded strings with `translations[lang].nextClassCard.*`.

---

## Buchen Page Changes

Read cookie, pass `lang` to each `ClassSlot`. Use `translations[lang].buchen.title` for heading.

---

## ClassSlot Changes

Add `lang: Lang` prop. Replace hardcoded strings (Buchen, Stornieren, GEBUCHT, WARTELISTE, Ausgebucht, error messages) with `translations[lang].classSlot.*`.

---

## Gürtel Page Changes

Read cookie, pass `lang` to `BeltProgress`. Use `translations[lang].gurtel.*` for headings.

---

## BeltProgress Changes

Add `lang: Lang` prop. Replace hardcoded strings (Gürtel, Kein Rang…, Stripes, Trainings, Monate, aria-label) with `translations[lang].belt.*`.

---

## Skills Page Changes

Read cookie, pass `lang` to each `SkillCard`. Use `translations[lang].skills.*` for headings and mastered counter.

---

## SkillCard Changes

Add `lang: Lang` prop. Replace `STATUS_LABELS` hardcoded object with:

```ts
const getStatusLabels = (lang: Lang) => ({
  not_started: translations[lang].skillCard.notStarted,
  in_progress:  translations[lang].skillCard.inProgress,
  mastered:     translations[lang].skillCard.mastered,
})
```

---

## Testing

- `lib/i18n/` — no unit tests (pure data objects)
- `app/actions/profile.ts` — `app/actions/__tests__/profile.test.ts` with 4 tests: unauthenticated, valid update, invalid schema, language update sets cookie
- `components/members/ProfileForm.tsx` — `components/members/__tests__/ProfileForm.test.tsx`: renders fields, shows saved state on success
- `components/members/LanguageToggle.tsx` — `components/members/__tests__/LanguageToggle.test.tsx`: renders two buttons, active state matches `current` prop, calls action on click

Server component pages (konto, updated dashboard, buchen, gürtel, skills) — no new unit tests; existing tests for ClassSlot/SkillCard/BeltProgress/NextClassCard updated to pass `lang` prop.

---

## Out of Scope

- Public site i18n (landing page stays German)
- Email notifications in English
- URL-based locale routing (`/en/members/...`)
- Right-to-left language support
