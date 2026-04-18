# Gym Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build gym-level configuration (info + opening hours + policies) managed at `/admin/gym` by the owner and surfaced across the public site (footer, `/kontakt`, `/impressum`) and the member portal (`/dashboard` widget, `/konto` policies).

**Architecture:** Singleton `gym_settings` table (CHECK id=1, RLS public-read/owner-write) + 3 owner-only server actions + server-side `getGymSettings()` fetcher used by every display point + helper library for opening-hour computation. Mutations use `revalidatePath('/', 'layout')` to invalidate all routes.

**Tech Stack:** Next.js 15 App Router · Supabase SSR with RLS · Tailwind semantic tokens · Vitest · TypeScript · `lucide-react` (Building2 icon already in deps).

**Spec:** `docs/superpowers/specs/2026-04-18-gym-settings-design.md`

---

## File Structure

**New DB migration:**
- `supabase/migrations/YYYYMMDD_gym_settings.sql`

**New shared library:**
- `lib/gym-settings.ts` — types + `getGymSettings()`
- `lib/opening-hours.ts` — pure date/time helpers

**New server actions:**
- `app/actions/gym-settings.ts`

**New components:**
- `components/admin/GymInfoForm.tsx`
- `components/admin/OpeningHoursForm.tsx`
- `components/admin/PoliciesForm.tsx`
- `components/public/OpeningHoursDisplay.tsx`
- `components/public/ContactCard.tsx`
- `components/members/OpeningHoursWidget.tsx`
- `components/members/PoliciesSection.tsx`

**New pages:**
- `app/(admin)/admin/gym/page.tsx`
- `app/(public)/kontakt/page.tsx`
- `app/(public)/impressum/page.tsx`

**Modified files:**
- `components/admin/AdminNav.tsx` — add `{ href: '/admin/gym', label: 'Gym', Icon: Building2 }` as first MANAGEMENT item
- `components/public/Footer.tsx` — consume `getGymSettings()` instead of hardcoded
- `components/public/NavBar.tsx` — ensure "Kontakt" link exists
- `app/(members)/dashboard/page.tsx` — render `OpeningHoursWidget`
- `app/(members)/konto/page.tsx` — render `PoliciesSection`
- `lib/i18n/de.ts` + `lib/i18n/en.ts` — add `admin.gym` + `public` blocks

---

## Task 1: DB migration + applied

**Files:**
- Create: `supabase/migrations/20260418_gym_settings.sql`

- [ ] **Step 1: Create the migration file**

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

- [ ] **Step 2: Apply via Supabase MCP tool**

Use `mcp__45258d9a-...__apply_migration` with name `gym_settings` and the SQL above. This applies the migration to the dev/prod Supabase project.

Alternatively, if MCP isn't available, commit the migration file and push — Supabase should pick it up via the next deploy hook, or the operator applies manually via `supabase db push`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418_gym_settings.sql
git commit -m "feat(db): add gym_settings singleton table with RLS"
```

---

## Task 2: Shared types + `getGymSettings()` fetcher

**Files:**
- Create: `lib/gym-settings.ts`

- [ ] **Step 1: Implement**

```typescript
import { createClient } from '@/lib/supabase/server'

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface OpeningHoursDay {
  open: string | null
  close: string | null
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

const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

const FALLBACK: GymSettings = {
  name: 'AXIS Jiu-Jitsu',
  address_line1: null, address_line2: null,
  postal_code: null, city: null, country: 'Österreich',
  phone: null, email: null, website: null,
  opening_hours: DEFAULT_OPENING_HOURS,
  house_rules: null, cancellation_policy: null, pricing_info: null,
  updated_at: new Date().toISOString(),
}

export async function getGymSettings(): Promise<GymSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gym_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return FALLBACK
  return data as GymSettings
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/gym-settings.ts
git commit -m "feat(gym): add GymSettings type and getGymSettings() fetcher"
```

---

## Task 3: Opening-hours helper library

**Files:**
- Create: `lib/opening-hours.ts`
- Create: `lib/__tests__/opening-hours.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import {
  dayKeyOf, isOpenNow, nextOpeningTime, groupIntoRanges, DAY_KEYS,
} from '../opening-hours'
import type { OpeningHours } from '../gym-settings'

const fullWeek: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

describe('dayKeyOf', () => {
  it('maps JS Date to Monday-first DayKey', () => {
    expect(dayKeyOf(new Date('2026-04-20T12:00:00'))).toBe('mon') // Mo
    expect(dayKeyOf(new Date('2026-04-26T12:00:00'))).toBe('sun') // So
    expect(dayKeyOf(new Date('2026-04-25T12:00:00'))).toBe('sat')
  })
})

describe('isOpenNow', () => {
  it('returns true when within hours', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T17:00:00'))).toBe(true) // Mo 17:00
  })
  it('returns false before opening', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T10:00:00'))).toBe(false) // Mo 10:00
  })
  it('returns false after closing', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T23:00:00'))).toBe(false) // Mo 23:00
  })
  it('returns false on closed day', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-26T12:00:00'))).toBe(false) // So
  })
  it('returns true at open boundary inclusive', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T16:00:00'))).toBe(true)
  })
  it('returns false at close boundary exclusive', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T22:00:00'))).toBe(false)
  })
})

describe('nextOpeningTime', () => {
  it('returns today later if gym not yet open', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-20T10:00:00'))
    expect(result).toEqual({ dayKey: 'mon', time: '16:00', isToday: true })
  })
  it('returns tomorrow after today closes', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-20T23:00:00'))
    expect(result).toEqual({ dayKey: 'tue', time: '16:00', isToday: false })
  })
  it('skips closed day (Sunday) to Monday', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-26T12:00:00')) // So
    expect(result).toEqual({ dayKey: 'mon', time: '16:00', isToday: false })
  })
  it('returns null when every day is closed', () => {
    const allClosed = Object.fromEntries(
      DAY_KEYS.map(k => [k, { open: null, close: null, closed: true }])
    ) as OpeningHours
    expect(nextOpeningTime(allClosed, new Date('2026-04-20T10:00:00'))).toBeNull()
  })
})

describe('groupIntoRanges', () => {
  it('groups Mo-Fr when same hours', () => {
    const { ranges, closedDays } = groupIntoRanges(fullWeek)
    expect(ranges).toEqual([
      { days: ['mon', 'tue', 'wed', 'thu', 'fri'], open: '16:00', close: '22:00' },
      { days: ['sat'], open: '10:00', close: '14:00' },
    ])
    expect(closedDays).toEqual(['sun'])
  })
  it('returns empty ranges for all-closed gym', () => {
    const allClosed = Object.fromEntries(
      DAY_KEYS.map(k => [k, { open: null, close: null, closed: true }])
    ) as OpeningHours
    const { ranges, closedDays } = groupIntoRanges(allClosed)
    expect(ranges).toEqual([])
    expect(closedDays).toEqual([...DAY_KEYS])
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npx vitest run lib/__tests__/opening-hours.test.ts`
Expected: FAIL (import resolution error).

- [ ] **Step 3: Implement `lib/opening-hours.ts`**

```typescript
import type { DayKey, OpeningHours } from './gym-settings'

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const DAY_LABELS_DE: Record<DayKey, string> = {
  mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So',
}

export const DAY_LABELS_FULL_DE: Record<DayKey, string> = {
  mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag',
  fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag',
}

export function dayKeyOf(date: Date): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7]
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  const today = hours[dayKeyOf(now)]
  if (today.closed || !today.open || !today.close) return false
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= toMinutes(today.open) && nowMin < toMinutes(today.close)
}

export interface NextOpening {
  dayKey: DayKey
  time: string
  isToday: boolean
}

export function nextOpeningTime(hours: OpeningHours, now: Date): NextOpening | null {
  const todayKey = dayKeyOf(now)
  const today = hours[todayKey]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (!today.closed && today.open && nowMin < toMinutes(today.open)) {
    return { dayKey: todayKey, time: today.open, isToday: true }
  }

  const startIdx = DAY_KEYS.indexOf(todayKey)
  for (let offset = 1; offset <= 7; offset++) {
    const key = DAY_KEYS[(startIdx + offset) % 7]
    const day = hours[key]
    if (!day.closed && day.open) {
      return { dayKey: key, time: day.open, isToday: false }
    }
  }
  return null
}

export interface DayRange {
  days: DayKey[]
  open: string
  close: string
}

export function groupIntoRanges(hours: OpeningHours): { ranges: DayRange[]; closedDays: DayKey[] } {
  const ranges: DayRange[] = []
  const closedDays: DayKey[] = []
  let currentRange: DayRange | null = null

  for (const key of DAY_KEYS) {
    const day = hours[key]
    if (day.closed || !day.open || !day.close) {
      closedDays.push(key)
      currentRange = null
      continue
    }
    if (currentRange && currentRange.open === day.open && currentRange.close === day.close) {
      currentRange.days.push(key)
    } else {
      currentRange = { days: [key], open: day.open, close: day.close }
      ranges.push(currentRange)
    }
  }
  return { ranges, closedDays }
}
```

- [ ] **Step 4: Verify tests pass**

Run: `npx vitest run lib/__tests__/opening-hours.test.ts`
Expected: all pass (13 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/opening-hours.ts lib/__tests__/opening-hours.test.ts
git commit -m "feat(gym): add opening-hours helper library (isOpenNow, nextOpeningTime, groupIntoRanges)"
```

---

## Task 4: Server actions

**Files:**
- Create: `app/actions/gym-settings.ts`
- Create: `app/actions/__tests__/gym-settings.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateGymInfo, updateOpeningHours, updatePolicies } from '../gym-settings'
import type { OpeningHours } from '@/lib/gym-settings'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

const validHours: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

describe('updateGymInfo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateGymInfo({ name: 'X' })).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateGymInfo({ name: 'AXIS', city: 'Wien' })
    expect(res.success).toBe(true)
  })
})

describe('updateOpeningHours', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateOpeningHours(validHours)).error).toBeTruthy()
  })
  it('rejects invalid shape (missing day)', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad = { ...validHours } as any
    delete bad.mon
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('rejects open day with missing times', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad: OpeningHours = { ...validHours, mon: { open: null, close: null, closed: false } }
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('rejects invalid time format', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad: OpeningHours = { ...validHours, mon: { open: '25:99', close: '22:00', closed: false } }
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateOpeningHours(validHours)
    expect(res.success).toBe(true)
  })
})

describe('updatePolicies', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updatePolicies({ house_rules: 'x' })).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updatePolicies({ house_rules: 'Be respectful.', pricing_info: '€99/mo' })
    expect(res.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npx vitest run app/actions/__tests__/gym-settings.test.ts`
Expected: FAIL (imports).

- [ ] **Step 3: Implement `app/actions/gym-settings.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OpeningHours } from '@/lib/gym-settings'
import { DAY_KEYS } from '@/lib/opening-hours'

async function assertOwner(): Promise<true | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return true
}

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

export async function updateGymInfo(data: GymInfoUpdate): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }
  if (!data.name?.trim()) return { error: 'Name ist Pflicht.' }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    address_line1: data.address_line1?.trim() || null,
    address_line2: data.address_line2?.trim() || null,
    postal_code: data.postal_code?.trim() || null,
    city: data.city?.trim() || null,
    country: data.country?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    website: data.website?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await (supabase.from('gym_settings') as any).update(payload).eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function validateHours(hours: OpeningHours): string | null {
  for (const key of DAY_KEYS) {
    const day = hours[key]
    if (!day) return `Tag fehlt: ${key}`
    if (day.closed) continue
    if (!day.open || !day.close) return `Zeiten fehlen für ${key}`
    if (!TIME_RE.test(day.open) || !TIME_RE.test(day.close)) return `Ungültige Zeit für ${key}`
  }
  return null
}

export async function updateOpeningHours(hours: OpeningHours): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const validationError = validateHours(hours)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await (supabase.from('gym_settings') as any)
    .update({ opening_hours: hours, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export interface PoliciesUpdate {
  house_rules?: string | null
  cancellation_policy?: string | null
  pricing_info?: string | null
}

export async function updatePolicies(data: PoliciesUpdate): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const supabase = await createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.house_rules !== undefined) payload.house_rules = data.house_rules?.trim() || null
  if (data.cancellation_policy !== undefined) payload.cancellation_policy = data.cancellation_policy?.trim() || null
  if (data.pricing_info !== undefined) payload.pricing_info = data.pricing_info?.trim() || null

  const { error } = await (supabase.from('gym_settings') as any).update(payload).eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  return { success: true }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run app/actions/__tests__/gym-settings.test.ts`
Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/gym-settings.ts app/actions/__tests__/gym-settings.test.ts
git commit -m "feat(gym): add owner-only gym-settings server actions with validation"
```

---

## Task 5: Admin forms (GymInfoForm, OpeningHoursForm, PoliciesForm)

**Files:**
- Create: `components/admin/GymInfoForm.tsx`
- Create: `components/admin/OpeningHoursForm.tsx`
- Create: `components/admin/PoliciesForm.tsx`

- [ ] **Step 1: `GymInfoForm.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateGymInfo } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import type { GymSettings } from '@/lib/gym-settings'

interface Props { initial: GymSettings }

export function GymInfoForm({ initial }: Props) {
  const [form, setForm] = useState({
    name: initial.name,
    address_line1: initial.address_line1 ?? '',
    address_line2: initial.address_line2 ?? '',
    postal_code: initial.postal_code ?? '',
    city: initial.city ?? '',
    country: initial.country ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    website: initial.website ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updateGymInfo(form)
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  const input = 'w-full border border-border bg-background p-2 text-sm'
  const label = 'mb-1 block text-xs text-muted-foreground'

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Gym-Info</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">Gespeichert.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Name *</label>
          <input className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Adresse</label>
          <input className={input} value={form.address_line1}
                 onChange={e => setForm({ ...form, address_line1: e.target.value })} placeholder="Straße und Nummer" />
        </div>
        <div className="sm:col-span-2">
          <input className={input} value={form.address_line2}
                 onChange={e => setForm({ ...form, address_line2: e.target.value })} placeholder="Top / Stiege (optional)" />
        </div>
        <div>
          <label className={label}>PLZ</label>
          <input className={input} value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ort</label>
          <input className={input} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Land</label>
          <input className={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
        <div>
          <label className={label}>Telefon</label>
          <input className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={label}>E-Mail</label>
          <input className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Website</label>
          <input className={input} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
      </div>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Speichern
      </button>
    </div>
  )
}
```

- [ ] **Step 2: `OpeningHoursForm.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateOpeningHours } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import { DAY_KEYS, DAY_LABELS_FULL_DE } from '@/lib/opening-hours'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { initial: OpeningHours }

export function OpeningHoursForm({ initial }: Props) {
  const [hours, setHours] = useState<OpeningHours>(initial)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleClosed(key: typeof DAY_KEYS[number]) {
    setHours(prev => {
      const day = prev[key]
      if (day.closed) {
        return { ...prev, [key]: { open: '16:00', close: '22:00', closed: false } }
      }
      return { ...prev, [key]: { open: null, close: null, closed: true } }
    })
  }

  function updateTime(key: typeof DAY_KEYS[number], field: 'open' | 'close', value: string) {
    setHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updateOpeningHours(hours)
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">Gespeichert.</p>}
      <ul className="space-y-2">
        {DAY_KEYS.map(key => {
          const day = hours[key]
          return (
            <li key={key} className="flex items-center gap-3">
              <span className="w-24 text-sm font-bold">{DAY_LABELS_FULL_DE[key]}</span>
              <input type="time" value={day.open ?? ''} disabled={day.closed}
                     onChange={e => updateTime(key, 'open', e.target.value)}
                     className="border border-border bg-background p-1 text-sm disabled:opacity-40" />
              <span className="text-sm text-muted-foreground">–</span>
              <input type="time" value={day.close ?? ''} disabled={day.closed}
                     onChange={e => updateTime(key, 'close', e.target.value)}
                     className="border border-border bg-background p-1 text-sm disabled:opacity-40" />
              <label className="ml-auto flex items-center gap-2 text-xs">
                <input type="checkbox" checked={day.closed} onChange={() => toggleClosed(key)} />
                geschlossen
              </label>
            </li>
          )
        })}
      </ul>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Speichern
      </button>
    </div>
  )
}
```

- [ ] **Step 3: `PoliciesForm.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updatePolicies } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import type { GymSettings } from '@/lib/gym-settings'

interface Props { initial: GymSettings }

export function PoliciesForm({ initial }: Props) {
  const [form, setForm] = useState({
    house_rules: initial.house_rules ?? '',
    cancellation_policy: initial.cancellation_policy ?? '',
    pricing_info: initial.pricing_info ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updatePolicies({
        house_rules: form.house_rules || null,
        cancellation_policy: form.cancellation_policy || null,
        pricing_info: form.pricing_info || null,
      })
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  const ta = 'w-full border border-border bg-background p-2 text-sm font-mono'
  const label = 'mb-1 block text-xs text-muted-foreground'

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Richtlinien</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">Gespeichert.</p>}
      <div className="space-y-4">
        <div>
          <label className={label}>Haus-Regeln</label>
          <textarea rows={8} className={ta} value={form.house_rules}
                    onChange={e => setForm({ ...form, house_rules: e.target.value })} />
        </div>
        <div>
          <label className={label}>Kündigungsfristen</label>
          <textarea rows={4} className={ta} value={form.cancellation_policy}
                    onChange={e => setForm({ ...form, cancellation_policy: e.target.value })} />
        </div>
        <div>
          <label className={label}>Preise</label>
          <textarea rows={6} className={ta} value={form.pricing_info}
                    onChange={e => setForm({ ...form, pricing_info: e.target.value })} />
        </div>
      </div>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Speichern
      </button>
    </div>
  )
}
```

- [ ] **Step 4: TS check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/GymInfoForm.tsx components/admin/OpeningHoursForm.tsx components/admin/PoliciesForm.tsx
git commit -m "feat(admin): add GymInfoForm, OpeningHoursForm, PoliciesForm"
```

---

## Task 6: Admin page + nav update

**Files:**
- Create: `app/(admin)/admin/gym/page.tsx`
- Modify: `components/admin/AdminNav.tsx`

- [ ] **Step 1: Create the admin page**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGymSettings } from '@/lib/gym-settings'
import { GymInfoForm } from '@/components/admin/GymInfoForm'
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm'
import { PoliciesForm } from '@/components/admin/PoliciesForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gym | Admin' }

export default async function AdminGymPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const settings = await getGymSettings()

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Gym</h1>
      <div className="space-y-6">
        <GymInfoForm initial={settings} />
        <div className="grid gap-6 lg:grid-cols-2">
          <OpeningHoursForm initial={settings.opening_hours} />
          <PoliciesForm initial={settings} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Modify `components/admin/AdminNav.tsx`**

Find the `managementItems` array. Add a new entry at the TOP of the array:

```typescript
const managementItems: NavItem[] = [
  { href: '/admin/gym',           label: 'Gym',           Icon: Building2 },
  { href: '/admin/mitglieder',    label: 'Mitglieder',    Icon: Users },
  { href: '/admin/guertel',       label: 'Gürtel',        Icon: Award },
  { href: '/admin/leads',         label: 'Leads',         Icon: ClipboardList },
  { href: '/admin/einstellungen', label: 'Einstellungen', Icon: Settings },
]
```

Add the import at the top of the file next to other lucide imports:

```typescript
import { LayoutDashboard, CheckSquare, CalendarDays, Users, Award, ClipboardList, Settings, LogOut, Menu, X, Building2 } from 'lucide-react'
```

- [ ] **Step 3: TS check + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/gym/page.tsx" components/admin/AdminNav.tsx
git commit -m "feat(admin): add /admin/gym page and AdminNav link"
```

---

## Task 7: Public display components

**Files:**
- Create: `components/public/OpeningHoursDisplay.tsx`
- Create: `components/public/ContactCard.tsx`

- [ ] **Step 1: `OpeningHoursDisplay.tsx`**

```typescript
import { DAY_LABELS_DE, groupIntoRanges } from '@/lib/opening-hours'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { hours: OpeningHours; variant?: 'compact' | 'full' }

export function OpeningHoursDisplay({ hours, variant = 'full' }: Props) {
  if (variant === 'compact') {
    const { ranges, closedDays } = groupIntoRanges(hours)
    return (
      <ul className="space-y-1 text-sm text-muted-foreground">
        {ranges.map((r, i) => {
          const daySpan = r.days.length === 1
            ? DAY_LABELS_DE[r.days[0]]
            : `${DAY_LABELS_DE[r.days[0]]}–${DAY_LABELS_DE[r.days[r.days.length - 1]]}`
          return (
            <li key={i} className="flex justify-between gap-6">
              <span>{daySpan}</span>
              <span className="font-mono">{r.open} – {r.close}</span>
            </li>
          )
        })}
        {closedDays.length > 0 && (
          <li className="flex justify-between gap-6">
            <span>{closedDays.map(d => DAY_LABELS_DE[d]).join(', ')}</span>
            <span className="text-xs italic">geschlossen</span>
          </li>
        )}
      </ul>
    )
  }

  return (
    <ul className="space-y-1 text-sm">
      {(Object.keys(hours) as Array<keyof typeof hours>).map(key => {
        const day = hours[key]
        return (
          <li key={key} className="flex justify-between gap-6">
            <span className="font-bold">{DAY_LABELS_DE[key]}</span>
            {day.closed ? (
              <span className="text-xs italic text-muted-foreground">geschlossen</span>
            ) : (
              <span className="font-mono text-muted-foreground">{day.open} – {day.close}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: `ContactCard.tsx`**

```typescript
import type { GymSettings } from '@/lib/gym-settings'

interface Props { settings: GymSettings }

export function ContactCard({ settings }: Props) {
  const { name, address_line1, address_line2, postal_code, city, country, phone, email, website } = settings
  const mapQuery = address_line1 && city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [address_line1, address_line2, postal_code, city, country].filter(Boolean).join(', ')
      )}`
    : null

  return (
    <div className="space-y-2 text-sm">
      <p className="text-lg font-black">{name}</p>
      {address_line1 && <p>{address_line1}</p>}
      {address_line2 && <p>{address_line2}</p>}
      {(postal_code || city) && <p>{[postal_code, city].filter(Boolean).join(' ')}</p>}
      {country && <p>{country}</p>}
      <div className="space-y-1 pt-2 text-muted-foreground">
        {phone && <p>📞 <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-foreground">{phone}</a></p>}
        {email && <p>✉️ <a href={`mailto:${email}`} className="hover:text-foreground">{email}</a></p>}
        {website && <p>🌐 <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{website}</a></p>}
      </div>
      {mapQuery && (
        <a href={mapQuery} target="_blank" rel="noopener noreferrer"
           className="mt-2 inline-block text-xs font-bold text-primary hover:underline">
          Auf Google Maps anzeigen →
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 3: TS check + commit**

Run: `npx tsc --noEmit`

```bash
git add components/public/OpeningHoursDisplay.tsx components/public/ContactCard.tsx
git commit -m "feat(public): add OpeningHoursDisplay and ContactCard components"
```

---

## Task 8: Footer rewrite + NavBar Kontakt link

**Files:**
- Modify: `components/public/Footer.tsx`
- Modify: `components/public/NavBar.tsx`

- [ ] **Step 1: Read existing Footer.tsx and NavBar.tsx**

Read both files to understand the current structure. The Footer likely uses hardcoded strings; you're replacing them with dynamic data from `getGymSettings()`.

Since the Footer is used across all pages, it must be converted to an async server component that fetches `getGymSettings()`. If it's already a server component, that's ideal. If it's a client component, refactor to server.

- [ ] **Step 2: Rewrite Footer.tsx**

```typescript
import Link from 'next/link'
import { getGymSettings } from '@/lib/gym-settings'
import { OpeningHoursDisplay } from './OpeningHoursDisplay'
import { ContactCard } from './ContactCard'

export async function Footer() {
  const settings = await getGymSettings()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <ContactCard settings={settings} />
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
          <OpeningHoursDisplay hours={settings.opening_hours} variant="compact" />
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Links</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><Link href="/kontakt" className="hover:text-foreground">Kontakt</Link></li>
            <li><Link href="/impressum" className="hover:text-foreground">Impressum</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.name}
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Update NavBar.tsx**

Read the existing NavBar. If it has a nav-links array, add `{ href: '/kontakt', label: 'Kontakt' }` in an appropriate position (typically before Login/CTA). If NavBar is hardcoded inline, add a `<Link href="/kontakt">Kontakt</Link>` element.

Minimal change — don't refactor structure, just add the link.

- [ ] **Step 4: TS check + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: all pass. If Footer had tests that relied on hardcoded strings, update those tests to mock `getGymSettings()`.

- [ ] **Step 5: Commit**

```bash
git add components/public/Footer.tsx components/public/NavBar.tsx
git commit -m "feat(public): wire Footer to getGymSettings and add Kontakt link to NavBar"
```

---

## Task 9: Public pages (/kontakt + /impressum)

**Files:**
- Create: `app/(public)/kontakt/page.tsx`
- Create: `app/(public)/impressum/page.tsx`

- [ ] **Step 1: `/kontakt/page.tsx`**

```typescript
import { getGymSettings } from '@/lib/gym-settings'
import { ContactCard } from '@/components/public/ContactCard'
import { OpeningHoursDisplay } from '@/components/public/OpeningHoursDisplay'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kontakt | AXIS Jiu-Jitsu' }

export default async function KontaktPage() {
  const settings = await getGymSettings()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-black text-foreground">Kontakt</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <ContactCard settings={settings} />
        </div>
        <div className="border border-border bg-card p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
          <OpeningHoursDisplay hours={settings.opening_hours} variant="full" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `/impressum/page.tsx`**

```typescript
import { getGymSettings } from '@/lib/gym-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impressum | AXIS Jiu-Jitsu' }

export default async function ImpressumPage() {
  const settings = await getGymSettings()
  const { name, address_line1, address_line2, postal_code, city, country, phone, email, website,
    house_rules, cancellation_policy, pricing_info } = settings

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-black text-foreground">Impressum</h1>

      <section className="mb-8 border border-border bg-card p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Angaben gemäß § 5 ECG</p>
        <p className="text-lg font-black">{name}</p>
        {address_line1 && <p className="text-sm">{address_line1}</p>}
        {address_line2 && <p className="text-sm">{address_line2}</p>}
        {(postal_code || city) && <p className="text-sm">{[postal_code, city].filter(Boolean).join(' ')}</p>}
        {country && <p className="text-sm">{country}</p>}
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {phone && <p>Telefon: {phone}</p>}
          {email && <p>E-Mail: {email}</p>}
          {website && <p>Website: {website}</p>}
        </div>
      </section>

      {[
        { title: 'Haus-Regeln', body: house_rules },
        { title: 'Kündigungsfristen', body: cancellation_policy },
        { title: 'Preise', body: pricing_info },
      ].map(section => (
        <details key={section.title} open className="mb-3 border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{section.title}</summary>
          <div className="whitespace-pre-line px-4 pb-4 text-sm text-muted-foreground">
            {section.body || '— Noch nicht gepflegt —'}
          </div>
        </details>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: TS check + commit**

Run: `npx tsc --noEmit`

```bash
git add "app/(public)/kontakt/page.tsx" "app/(public)/impressum/page.tsx"
git commit -m "feat(public): add /kontakt and /impressum pages"
```

---

## Task 10: Member widget + konto section

**Files:**
- Create: `components/members/OpeningHoursWidget.tsx`
- Create: `components/members/PoliciesSection.tsx`
- Modify: `app/(members)/dashboard/page.tsx`
- Modify: `app/(members)/konto/page.tsx`

- [ ] **Step 1: `OpeningHoursWidget.tsx`**

```typescript
import { isOpenNow, nextOpeningTime, DAY_LABELS_DE } from '@/lib/opening-hours'
import { OpeningHoursDisplay } from '@/components/public/OpeningHoursDisplay'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { hours: OpeningHours }

export function OpeningHoursWidget({ hours }: Props) {
  const now = new Date()
  const open = isOpenNow(hours, now)
  const todayKey = (['mon','tue','wed','thu','fri','sat','sun'] as const)[(now.getDay() + 6) % 7]
  const today = hours[todayKey]
  const next = open ? null : nextOpeningTime(hours, now)

  let statusLine: string
  let statusTone: string
  if (open && today.close) {
    statusLine = `Jetzt geöffnet bis ${today.close}`
    statusTone = 'text-[#2e7d32]'
  } else if (next?.isToday) {
    statusLine = `Geschlossen · öffnet heute um ${next.time}`
    statusTone = 'text-muted-foreground'
  } else if (next) {
    statusLine = `Geschlossen · öffnet ${DAY_LABELS_DE[next.dayKey]} ${next.time}`
    statusTone = 'text-muted-foreground'
  } else {
    statusLine = 'Aktuell geschlossen'
    statusTone = 'text-muted-foreground'
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
      <p className={`mb-3 text-sm font-bold ${statusTone}`}>{statusLine}</p>
      <OpeningHoursDisplay hours={hours} variant="compact" />
    </div>
  )
}
```

- [ ] **Step 2: `PoliciesSection.tsx`**

```typescript
import type { GymSettings } from '@/lib/gym-settings'

interface Props { settings: GymSettings }

export function PoliciesSection({ settings }: Props) {
  const sections = [
    { title: 'Haus-Regeln', body: settings.house_rules },
    { title: 'Kündigungsfristen', body: settings.cancellation_policy },
    { title: 'Preise', body: settings.pricing_info },
  ]

  if (sections.every(s => !s.body)) return null

  return (
    <div className="mt-8 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gym-Informationen</p>
      {sections.map(section => (
        <details key={section.title} className="border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{section.title}</summary>
          <div className="whitespace-pre-line px-4 pb-4 text-sm text-muted-foreground">
            {section.body || '— Noch nicht verfügbar —'}
          </div>
        </details>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Modify `app/(members)/dashboard/page.tsx`**

Import and add `OpeningHoursWidget`. Fetch `getGymSettings()` in the page, then pass `hours` prop. Place the widget after the existing content (e.g., after `BeltProgress` card):

```typescript
import { OpeningHoursWidget } from '@/components/members/OpeningHoursWidget'
import { getGymSettings } from '@/lib/gym-settings'

// ...in the page function, after existing fetches:
const gym = await getGymSettings()

// ...in JSX, add where BeltProgress ends:
<OpeningHoursWidget hours={gym.opening_hours} />
```

Place in the existing grid cell appropriate to the page layout. If the dashboard already uses `grid sm:col-span-*`, wrap the widget in a similar span so it fits alongside other cards.

- [ ] **Step 4: Modify `app/(members)/konto/page.tsx`**

Add `PoliciesSection` at the bottom:

```typescript
import { PoliciesSection } from '@/components/members/PoliciesSection'
import { getGymSettings } from '@/lib/gym-settings'

// ...
const gym = await getGymSettings()

// ...at the end of the page JSX:
<PoliciesSection settings={gym} />
```

- [ ] **Step 5: TS check + full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/members/OpeningHoursWidget.tsx components/members/PoliciesSection.tsx "app/(members)/dashboard/page.tsx" "app/(members)/konto/page.tsx"
git commit -m "feat(members): add OpeningHoursWidget on dashboard and PoliciesSection on konto"
```

---

## Task 11: i18n additions

**Files:**
- Modify: `lib/i18n/de.ts`
- Modify: `lib/i18n/en.ts`

- [ ] **Step 1: Extend `lib/i18n/de.ts`**

Append to the existing `admin` object:

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
},
```

Also add a top-level `public` object (if not present, create it; otherwise append):

```typescript
public: {
  contact: 'Kontakt',
  impressum: 'Impressum',
  openingHours: 'Öffnungszeiten',
  showOnMap: 'Auf Google Maps anzeigen',
},
```

- [ ] **Step 2: Mirror in `lib/i18n/en.ts`**

```typescript
gym: {
  title: 'Gym',
  info: 'Gym Info',
  hours: 'Opening hours',
  policies: 'Policies',
  name: 'Name',
  address: 'Address',
  postalCode: 'Postal code',
  city: 'City',
  country: 'Country',
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  closed: 'closed',
  openNow: 'Open now until {time}',
  closedOpensToday: 'Closed · opens today at {time}',
  closedOpensLater: 'Closed · opens {day} {time}',
  houseRules: 'House rules',
  cancellationPolicy: 'Cancellation',
  pricingInfo: 'Pricing',
  save: 'Save',
},
```

```typescript
public: {
  contact: 'Contact',
  impressum: 'Imprint',
  openingHours: 'Opening hours',
  showOnMap: 'Show on Google Maps',
},
```

Note: Components built in earlier tasks use hardcoded German strings for consistency with existing Phase 2a/2b patterns. Wiring the i18n keys into the actual components is out of scope for this task — this task only adds the keys to enable future consumers.

- [ ] **Step 3: TS check + commit**

Run: `npx tsc --noEmit`

```bash
git add lib/i18n/de.ts lib/i18n/en.ts
git commit -m "feat(i18n): add admin.gym and public i18n keys for gym settings"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: 153 baseline + 3 test files added (opening-hours, gym-settings actions, plus any component tests) = ~175+ tests, all passing.

- [ ] **Step 2: TypeScript**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual smoke test (after Vercel preview)**
  - [ ] Visit footer on any public page → shows gym info + opening hours + links
  - [ ] Visit `/kontakt` → ContactCard + full OpeningHoursDisplay
  - [ ] Visit `/impressum` → ECG info + 3 collapsible policy sections
  - [ ] Login as owner → `/admin/gym` accessible; 3 forms (info / hours / policies)
  - [ ] Edit gym name → save → footer everywhere updates after next request
  - [ ] Set Sunday to "geschlossen" → time inputs disabled
  - [ ] Member dashboard → OpeningHoursWidget shows correct "open now" / "opens later" state
  - [ ] Member `/konto` → PoliciesSection at bottom with collapsibles
  - [ ] Coach visits `/admin/gym` → redirected to `/admin/dashboard`

---

## Summary

**11 tasks.** After completion, the gym has a full configuration system: one singleton row with RLS enforces owner-only writes; `getGymSettings()` is the single source of truth for all display points; helper library makes "is open now?" trivial; admin UI is clean with separate save actions per section. No breaking changes — existing pages that used hardcoded strings now render dynamic content from the seeded default row.
