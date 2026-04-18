# AXISJJ Gym Settings — Design Spec

**Date:** 2026-04-18
**Scope:** A gym-level configuration system — Gym info, opening hours, and policies — managed at `/admin/gym` (owner-only), displayed on public pages (footer, `/kontakt`, `/impressum`) and in the member portal (`/dashboard` widget, `/konto` policies section).

**Prerequisite:** Phase 2a (PR #6) and Phase 2b (PR #7) merged. Routing fix (PR #8) merged.

---

## 1. Goals

Give the owner a single place to edit all gym-level information that currently lives as hardcoded strings in the codebase (gym name, address, footer copy). Surface that information consistently wherever it matters: on marketing pages, in the member portal, and as the source of truth for future auto-filled emails.

Coaches do not have access — this is brand/legal content the owner controls.

---

## 2. Roles & Access

| Feature | public | member | coach | owner |
|---|---|---|---|---|
| View footer (all pages) | ✓ | ✓ | ✓ | ✓ |
| View `/kontakt` | ✓ | ✓ | ✓ | ✓ |
| View `/impressum` | ✓ | ✓ | ✓ | ✓ |
| `/dashboard` opening-hours widget | — | ✓ | ✓ (if they visit as member) | ✓ |
| `/konto` policies section | — | ✓ | ✓ | ✓ |
| `/admin/gym` | — | — | — | ✓ |

Middleware at `middleware.ts` already guards `/admin/*`. Page-level owner check in `/admin/gym/page.tsx` additionally blocks coaches (redirect to `/admin/dashboard`). All mutation server actions verify owner role from DB.

---

## 3. Architecture

### Route additions

```
app/
├── (admin)/admin/
│   └── gym/page.tsx                ← NEW: owner-only settings form
├── (public)/
│   ├── kontakt/page.tsx            ← NEW: contact details + opening hours
│   └── impressum/page.tsx          ← NEW: Impressum + policies
└── actions/gym-settings.ts         ← NEW: server actions
```

### Route modifications

```
app/(members)/
├── dashboard/page.tsx              ← add OpeningHoursWidget below BeltProgress
└── konto/page.tsx                  ← add Policies collapsible at end
```

### Component additions

```
components/
├── admin/
│   ├── GymInfoForm.tsx             ← 8 text fields + save
│   ├── OpeningHoursForm.tsx        ← 7 day rows (time inputs + "geschlossen" toggle) + save
│   └── PoliciesForm.tsx            ← 3 textareas + save
├── public/
│   ├── OpeningHoursDisplay.tsx     ← grouped wochentage read-only render
│   ├── ContactCard.tsx             ← address + contact info display
│   ├── Footer.tsx (modified)       ← consumes getGymSettings() instead of hardcoded
│   └── NavBar.tsx (modified)       ← ensure "Kontakt" link exists
└── members/
    ├── OpeningHoursWidget.tsx      ← "Jetzt geöffnet bis 22:00" / "Geschlossen · öffnet Mo 16:00"
    └── PoliciesSection.tsx         ← collapsible house rules / cancellation / pricing
```

### Shared helpers

```
lib/
├── gym-settings.ts                 ← getGymSettings() server-side fetcher
└── opening-hours.ts                ← isOpenNow(), nextOpeningTime(), formatDayRanges()
```

### AdminNav update

`components/admin/AdminNav.tsx` — add a new entry in `managementItems` (owner sees it, coach does not because the MANAGEMENT group is owner-only):

```typescript
{ href: '/admin/gym', label: 'Gym', Icon: Building2 }  // place as first MANAGEMENT item
```

Use `Building2` from `lucide-react` (already a dependency).

---

## 4. Database

### Migration: `supabase/migrations/YYYYMMDD_gym_settings.sql`

```sql
CREATE TABLE gym_settings (
  id                   INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name                 TEXT NOT NULL DEFAULT 'AXIS Jiu-Jitsu',
  address_line1        TEXT,
  address_line2        TEXT,
  postal_code          TEXT,
  city                 TEXT,
  country              TEXT DEFAULT 'Österreich',
  phone                TEXT,
  email                TEXT,
  website              TEXT,
  opening_hours        JSONB NOT NULL DEFAULT '{
    "mon": {"open": "16:00", "close": "22:00", "closed": false},
    "tue": {"open": "16:00", "close": "22:00", "closed": false},
    "wed": {"open": "16:00", "close": "22:00", "closed": false},
    "thu": {"open": "16:00", "close": "22:00", "closed": false},
    "fri": {"open": "16:00", "close": "22:00", "closed": false},
    "sat": {"open": "10:00", "close": "14:00", "closed": false},
    "sun": {"open": null, "close": null, "closed": true}
  }'::jsonb,
  house_rules          TEXT,
  cancellation_policy  TEXT,
  pricing_info         TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gym_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_settings readable by all"
  ON gym_settings FOR SELECT USING (true);

CREATE POLICY "gym_settings writable by owner"
  ON gym_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
```

**Singleton enforcement:** `id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1)` guarantees exactly one row — any attempt to insert a second row fails the CHECK constraint. The seeded row with `ON CONFLICT DO NOTHING` means re-running the migration is safe.

**Write safety:** Server actions also enforce owner role before the UPDATE (defense in depth). Reads are public — no secret data in `gym_settings`.

### TypeScript types

`lib/gym-settings.ts`:

```typescript
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface OpeningHoursDay {
  open: string | null   // "HH:MM" 24h format
  close: string | null  // "HH:MM" 24h format
  closed: boolean
}

export type OpeningHours = Record<DayKey, OpeningHoursDay>

export interface GymSettings {
  name: string
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: OpeningHours
  house_rules: string | null
  cancellation_policy: string | null
  pricing_info: string | null
  updated_at: string
}

export async function getGymSettings(): Promise<GymSettings>
```

Called from any server component that needs gym data. Returns the singleton row cast to `GymSettings`. Next.js' per-request cache means one call per request even across many components.

---

## 5. Admin Page (`/admin/gym`)

Owner-only. Three independent form sections, each with its own "Speichern" button. Layout: single column on mobile, `lg:grid-cols-2` with the first form spanning 2 columns on desktop:

### GymInfoForm (top, full width)

Fields (label → input):
- `name` (required, text)
- `address_line1`, `address_line2` (text)
- `postal_code`, `city` (side-by-side, text)
- `country` (text)
- `phone`, `email`, `website` (text)

Submit button → `updateGymInfo(data)` server action.

### OpeningHoursForm (bottom-left)

7 rows for Mo–So. Each row:
- Day label
- `open` `<input type="time">` — disabled when `closed === true`
- `close` `<input type="time">` — disabled when `closed === true`
- `<input type="checkbox">` labeled "geschlossen"

State held as a single `OpeningHours` object; toggling "closed" clears `open`/`close` to `null` but keeps them in state for restore-on-untoggle UX (local only). Save button → `updateOpeningHours(hours)`.

### PoliciesForm (bottom-right)

Three `<textarea>` fields:
- `house_rules` (rows=8)
- `cancellation_policy` (rows=4)
- `pricing_info` (rows=6)

Rendered as plain text with `whitespace-pre-line` on display pages (no markdown parsing in Phase 1). Save → `updatePolicies(data)`.

### Error handling

Each form has its own `error` state + `<p className="text-destructive">` render. On success, `router.refresh()` re-fetches server data. Optimistic update not needed — data is small, network round-trip is fast.

---

## 6. Server Actions (`app/actions/gym-settings.ts`)

All owner-only. Pattern matches Phase 2b server actions.

```typescript
async function assertOwner(): Promise<true | { error: string }>
// Helper: auth + profile.role === 'owner'. Shared with all three exports.

export interface GymInfoUpdate {
  name: string
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
}
export async function updateGymInfo(data: GymInfoUpdate): Promise<{ success?: true; error?: string }>

export async function updateOpeningHours(hours: OpeningHours): Promise<{ success?: true; error?: string }>
// Validates shape: all 7 day keys present; if closed=false, open+close must be valid "HH:MM".

export interface PoliciesUpdate {
  house_rules?: string | null
  cancellation_policy?: string | null
  pricing_info?: string | null
}
export async function updatePolicies(data: PoliciesUpdate): Promise<{ success?: true; error?: string }>
```

All three call `revalidatePath('/', 'layout')` on success — this invalidates every cached page (footer + kontakt + impressum + member dashboard). Acceptable because settings change rarely.

Each UPDATE targets `WHERE id = 1` explicitly (no full-table update possible).

---

## 7. Public Display

### Footer (`components/public/Footer.tsx`)

Rewritten to consume `getGymSettings()`. Three columns on desktop:

**Column 1: Gym-Info**
```
AXIS Jiu-Jitsu
Hauptstraße 12, Top 3
1010 Wien, Österreich
📞 +43 660 1234567
✉️ hallo@axisjj.at
```

**Column 2: Öffnungszeiten** (grouped by consecutive same-hours days via `formatDayRanges()`)
```
Mo–Fr  16:00 – 22:00
Sa     10:00 – 14:00
So     geschlossen
```

**Column 3: Links**
```
Kontakt · Impressum · Login
```

Copyright line: `© {year} {gymSettings.name}`. Uses current year client-side to avoid stale SSR.

### `/kontakt` page

Server component. Fetches `getGymSettings()`, renders:
- Gym name + address block
- Contact (phone, email, website) with `mailto:` / `tel:` / external links
- Opening hours full list (not grouped — one line per day for clarity)
- Optional "Auf Google Maps anzeigen" link generated as `https://www.google.com/maps/search/?api=1&query=` + URL-encoded address string (only rendered if address_line1 + city both non-null)

Uses existing NavBar + Footer.

### `/impressum` page

Server component. Fetches `getGymSettings()`, renders:
- Gym name + full address + contact (legal requirement)
- Three sections with `whitespace-pre-line` rendering:
  - "Haus-Regeln" → `house_rules`
  - "Kündigungsfristen" → `cancellation_policy`
  - "Preise" → `pricing_info`
- Each section collapsible via `<details>`/`<summary>` (native HTML, no JS) — all expanded by default on first load

If a policy field is null, the section renders with a placeholder "— Noch nicht gepflegt —" (only visible in dev; owner sees it as a prompt to fill in).

### NavBar link

Ensure `components/public/NavBar.tsx` includes a `Kontakt` link pointing to `/kontakt`. If the NavBar already has generic nav items, append; otherwise add.

---

## 8. Member Portal Display

### OpeningHoursWidget (`components/members/OpeningHoursWidget.tsx`)

Small card on `/dashboard`, placed after `BeltProgress` in the same grid. Server component — receives pre-fetched `OpeningHours` as prop from the page.

Uses `isOpenNow(hours, new Date())` helper. Three possible states:

1. **Open now:** "Jetzt geöffnet bis {close time}" (e.g., "bis 22:00"), green accent color
2. **Closed, opens today:** "Geschlossen · öffnet heute um {open time}"
3. **Closed, opens later:** "Geschlossen · öffnet {day abbrev} {open time}" (e.g., "öffnet Mo 16:00")

Below the state line: full week list (compact).

### PoliciesSection on `/konto`

Added below existing `ProfileForm` and `LanguageToggle`. Uses native `<details>` for each policy:

```tsx
<details className="mt-4 border border-border bg-card">
  <summary className="cursor-pointer px-4 py-3 text-sm font-bold">Haus-Regeln</summary>
  <div className="px-4 pb-4 text-sm whitespace-pre-line text-muted-foreground">{house_rules}</div>
</details>
```

Repeat for cancellation_policy and pricing_info. Null fields render a single "— Noch nicht verfügbar —" placeholder text.

---

## 9. Helper Library (`lib/opening-hours.ts`)

```typescript
export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const DAY_LABELS_DE: Record<DayKey, string> = {
  mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So',
}

export const DAY_LABELS_FULL_DE: Record<DayKey, string> = {
  mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag',
  fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag',
}

export function dayKeyOf(date: Date): DayKey
// Returns DAY_KEYS[(date.getDay() + 6) % 7] — JS Sunday=0, we want Monday=0

export function isOpenNow(hours: OpeningHours, now: Date): boolean
// Returns true if hours[todayKey].closed === false AND current HH:MM is between open and close.

export interface NextOpening {
  dayKey: DayKey
  time: string          // "HH:MM"
  isToday: boolean      // true if today, later; false if future day
}
export function nextOpeningTime(hours: OpeningHours, now: Date): NextOpening | null
// Returns the next moment the gym opens (checking today first if gym hasn't opened yet, then iterating forward up to 7 days). Null if gym is closed every day.

export interface DayRange {
  days: DayKey[]         // consecutive days with same open/close
  open: string
  close: string
}
export function groupIntoRanges(hours: OpeningHours): { ranges: DayRange[]; closedDays: DayKey[] }
// Groups consecutive days with identical open/close times for "Mo–Fr 16:00–22:00" rendering.
// closedDays lists days where closed=true, to render separately as "So geschlossen".
```

All pure functions — unit tests cover edge cases:
- Midnight boundary ("22:00–23:59")
- Day-rollover when now is after close (should advance to next open day)
- All-closed gym returns null from nextOpeningTime
- Consecutive-days grouping for Mo–Fr same hours → single range

---

## 10. Testing

### Server action tests (`app/actions/__tests__/gym-settings.test.ts`)

For each of the 3 exports, test:
- Unauthenticated → error
- Coach role → error (only owner allowed)
- Owner → UPDATE succeeds, calls `revalidatePath('/', 'layout')`

For `updateOpeningHours`: test invalid shape (missing day key, invalid time string, closed=false without open/close) → error.

### Helper tests (`lib/__tests__/opening-hours.test.ts`)

Covers `isOpenNow`, `nextOpeningTime`, `groupIntoRanges`, `dayKeyOf`. Use fixed `Date` inputs to avoid timezone flakiness.

### Component tests

`OpeningHoursWidget.test.tsx` — renders the three states (open-now / closed-opens-today / closed-opens-later) based on mocked helper output.

No component tests for forms (matches Phase 2a/2b pattern — server actions are the testable unit).

---

## 11. i18n

Extend `lib/i18n/de.ts` + `lib/i18n/en.ts` `admin` object with `gym` sub-block:

```typescript
gym: {
  title: 'Gym',
  info: 'Gym-Info',
  hours: 'Öffnungszeiten',
  policies: 'Richtlinien',
  name: 'Name',
  address: 'Adresse',
  postalCode: 'PLZ',
  city: 'Ort',
  country: 'Land',
  phone: 'Telefon',
  email: 'E-Mail',
  website: 'Website',
  closed: 'geschlossen',
  openNow: 'Jetzt geöffnet bis {time}',
  closedOpensToday: 'Geschlossen · öffnet heute um {time}',
  closedOpensLater: 'Geschlossen · öffnet {day} {time}',
  houseRules: 'Haus-Regeln',
  cancellationPolicy: 'Kündigungsfristen',
  pricingInfo: 'Preise',
  save: 'Speichern',
}
```

English equivalents mirror structure.

Also a top-level `public` i18n key for the NavBar "Kontakt" link and for the `/kontakt`/`/impressum` page titles:

```typescript
public: {
  contact: 'Kontakt' | 'Contact',
  impressum: 'Impressum' | 'Impressum',
  openingHours: 'Öffnungszeiten' | 'Opening hours',
  showOnMap: 'Auf Google Maps anzeigen' | 'Show on Google Maps',
}
```

---

## 12. Rollout

1. New branch `feature/phase8-gym-settings` off `main`
2. Implementation plan decomposes into ~10 tasks (migration → types/helpers → server actions → admin forms → admin page → public pages → member widget/section → footer rewrite → nav updates → final verification)
3. Final PR once all tests pass, TS compiles, and manual smoke-test passes on Vercel preview

---

## 13. Out of Scope

- **Multi-location support** (Phase 2d if AXIS expands) — schema would need a second `gym_locations` table referenced by class_sessions
- **Opening-hour exceptions** (holidays, custom closures) — would need an `opening_exceptions` table
- **Rich-text / Markdown rendering** for policies — plain text with `whitespace-pre-line` is sufficient; if rich formatting becomes necessary, use a separate skill (react-markdown) in a later phase
- **Email footer auto-fill** with gym info — separate feature when transactional email system is built
- **Address geocoding** — we only link to a Google Maps search URL, no map embed, no lat/lng storage
- **Audit log of settings changes** — `updated_at` + git history suffice for now
