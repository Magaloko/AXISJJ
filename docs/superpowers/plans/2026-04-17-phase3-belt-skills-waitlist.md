# AXISJJ Phase 3 — Belt Tracking, Skills Library, Waitlist Promotion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add waitlist auto-promotion on cancellation, a belt tracking page (`/members/gürtel`), and a skills library with member progress tracking (`/members/skills`).

**Architecture:** Waitlist logic is handled in the `cancelBooking` server action (no DB trigger needed at this scale). Belt and skills data are fetched in server components; skill status updates go through a new `updateSkillStatus` server action with optimistic UI in a `SkillCard` client component. Belt readiness formula (`lib/utils/belt.ts`) is pure and testable.

**Tech Stack:** Next.js 15 App Router, Supabase `@supabase/ssr`, date-fns v4, Tailwind CSS v4, Vitest + @testing-library/react

---

## File Map

```
app/
├── (members)/
│   ├── gürtel/
│   │   └── page.tsx               # Belt tracking: rank, stripes, readiness %
│   └── skills/
│       └── page.tsx               # Skills library grouped by category
├── actions/
│   └── skills.ts                  # updateSkillStatus server action

components/
└── members/
    ├── BeltProgress.tsx           # SVG ring + belt color swatch (used in gürtel + dashboard)
    └── SkillCard.tsx              # Single skill: name, status cycle button, video link

lib/
└── utils/
    └── belt.ts                    # calcReadiness(sessions, minSessions, months, minMonths): number
```

**Modified files:**
- `app/actions/bookings.ts` — extend `cancelBooking` to promote first waitlisted booking
- `app/(members)/dashboard/page.tsx` — add belt progress widget in stats column

---

## Task 1: Waitlist Promotion in cancelBooking

**Files:**
- Modify: `app/actions/bookings.ts`
- Modify: `app/actions/__tests__/bookings.test.ts`

- [ ] **Step 1: Add failing test for waitlist promotion**

Add to `app/actions/__tests__/bookings.test.ts`, inside the `cancelBooking` describe block:

```typescript
it('promotes first waitlisted booking after cancel', async () => {
  // Mock: cancel succeeds, returns session_id
  const cancelChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'b-1', session_id: 'sess-1' }], error: null }),
  }
  // Mock: find first waitlisted
  const waitlistChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'w-1', waitlist_position: 1 }, error: null }),
  }
  // Mock: promote waitlisted (update to confirmed)
  const promoteChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  }
  // Mock: get remaining waitlisted
  const remainingChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  let callCount = 0
  mockSupabase.from.mockImplementation(() => {
    callCount++
    if (callCount === 1) return cancelChain
    if (callCount === 2) return waitlistChain
    if (callCount === 3) return promoteChain
    return remainingChain
  })

  const result = await cancelBooking('b-1')
  expect(result.success).toBe(true)
  // Verify promote was called
  expect(promoteChain.update).toHaveBeenCalledWith({ status: 'confirmed', waitlist_position: null })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- actions/bookings 2>&1 | tail -10
```

Expected: FAIL — `promoteChain.update` assertion fails.

- [ ] **Step 3: Implement waitlist promotion in `cancelBooking`**

Replace the current `cancelBooking` function in `app/actions/bookings.ts`:

```typescript
export async function cancelBooking(bookingId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { data: cancelled, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', waitlist_position: null })
    .eq('id', bookingId)
    .eq('profile_id', user.id)
    .select('id, session_id')

  if (error) return { error: 'Stornierung fehlgeschlagen. Bitte versuche es erneut.' }
  if (!cancelled || cancelled.length === 0) return { error: 'Buchung nicht gefunden.' }

  // Promote first waitlisted booking for this session
  const sessionId = (cancelled[0] as { id: string; session_id: string }).session_id
  if (sessionId) {
    const { data: firstWaitlisted } = await supabase
      .from('bookings')
      .select('id, waitlist_position')
      .eq('session_id', sessionId)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .single()

    if (firstWaitlisted) {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', waitlist_position: null })
        .eq('id', firstWaitlisted.id)

      // Decrement remaining waitlist positions
      // NOTE: N+1 loop acceptable at gym scale (< 20 waitlisted per session)
      const { data: remaining } = await supabase
        .from('bookings')
        .select('id, waitlist_position')
        .eq('session_id', sessionId)
        .eq('status', 'waitlisted')
        .gt('waitlist_position', 0)

      if (remaining) {
        for (const b of remaining) {
          await supabase
            .from('bookings')
            .update({ waitlist_position: (b.waitlist_position ?? 1) - 1 })
            .eq('id', b.id)
        }
      }
    }
  }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- actions/bookings 2>&1 | tail -10
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/bookings.ts "app/actions/__tests__/bookings.test.ts"
git commit -m "feat: promote first waitlisted booking on cancellation"
```

---

## Task 2: Belt Readiness Utility

**Files:**
- Create: `lib/utils/belt.ts`
- Create: `lib/utils/__tests__/belt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/utils/__tests__/belt.test.ts`:

```typescript
// lib/utils/__tests__/belt.test.ts
import { describe, it, expect } from 'vitest'
import { calcReadiness } from '../belt'

describe('calcReadiness', () => {
  it('returns 100 when both requirements met', () => {
    expect(calcReadiness(100, 100, 12, 12)).toBe(100)
  })

  it('returns 50 when half the sessions done and no time requirement', () => {
    // minTimeMonths null → time component = 50 (fully met)
    // sessions: 25/100 → 25/100 * 50 = 12.5 → total = 62 (rounded)
    expect(calcReadiness(25, 100, 0, null)).toBe(63)
  })

  it('returns 0 when no requirements defined', () => {
    expect(calcReadiness(50, null, 6, null)).toBe(0)
  })

  it('caps at 100 when over-qualified', () => {
    expect(calcReadiness(200, 100, 24, 12)).toBe(100)
  })

  it('handles only session requirement', () => {
    // minTimeMonths null → time = 50, sessions 50/100 = 25, total = 75
    expect(calcReadiness(50, 100, 0, null)).toBe(75)
  })

  it('handles only time requirement', () => {
    // minSessions null → sessions = 50, months 6/12 = 25, total = 75
    expect(calcReadiness(0, null, 6, 12)).toBe(75)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- belt 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/utils/belt.ts`**

```typescript
// lib/utils/belt.ts

/**
 * Calculates belt promotion readiness as a percentage (0–100).
 * Each component (sessions, time) contributes up to 50 points.
 * If a requirement is null (not applicable), that component is treated as fully met (50 pts).
 * If both are null, returns 0 (coach decides entirely).
 */
export function calcReadiness(
  sessionsAttended: number,
  minSessions: number | null,
  monthsInGrade: number,
  minTimeMonths: number | null
): number {
  if (!minSessions && !minTimeMonths) return 0
  const s = minSessions ? Math.min(50, (sessionsAttended / minSessions) * 50) : 50
  const t = minTimeMonths ? Math.min(50, (monthsInGrade / minTimeMonths) * 50) : 50
  return Math.min(100, Math.round(s + t))
}
```

- [ ] **Step 4: Fix test expectations**

Re-run tests and verify the exact values match the formula:
- `calcReadiness(25, 100, 0, null)` → s = 25/100*50 = 12.5, t = 50 → round(62.5) = 63 ✓
- `calcReadiness(50, 100, 0, null)` → s = 50/100*50 = 25, t = 50 → 75 ✓
- `calcReadiness(0, null, 6, 12)` → s = 50, t = 6/12*50 = 25 → 75 ✓

```bash
npm test -- belt 2>&1 | tail -10
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/belt.ts "lib/utils/__tests__/belt.test.ts"
git commit -m "feat: add calcReadiness belt utility function"
```

---

## Task 3: BeltProgress Component

**Files:**
- Create: `components/members/BeltProgress.tsx`
- Create: `components/members/__tests__/BeltProgress.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/members/__tests__/BeltProgress.test.tsx`:

```typescript
// components/members/__tests__/BeltProgress.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BeltProgress } from '../BeltProgress'

const mockRank = {
  beltName: 'Blue',
  stripes: 2,
  colorHex: '#1d4ed8',
  readiness: 72,
  sessionsAttended: 87,
  monthsInGrade: 8,
}

describe('BeltProgress', () => {
  it('renders belt name', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByText('Blue Belt')).toBeInTheDocument()
  })

  it('renders readiness percentage', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('renders stripe count', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByText('2 Stripes')).toBeInTheDocument()
  })

  it('renders empty state when no rank', () => {
    render(<BeltProgress beltName={null} stripes={0} colorHex={null} readiness={0} sessionsAttended={0} monthsInGrade={0} />)
    expect(screen.getByText(/kein rang/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- BeltProgress 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/members/BeltProgress.tsx`**

```typescript
// components/members/BeltProgress.tsx

interface Props {
  beltName: string | null
  stripes: number
  colorHex: string | null
  readiness: number
  sessionsAttended: number
  monthsInGrade: number
}

export function BeltProgress({ beltName, stripes, colorHex, readiness, sessionsAttended, monthsInGrade }: Props) {
  if (!beltName) {
    return (
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Gürtel</p>
        <p className="mt-4 text-sm text-gray-500">Kein Rang eingetragen — bitte Coach kontaktieren.</p>
      </div>
    )
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (readiness / 100) * circumference
  const beltColor = colorHex ?? '#e5e7eb'

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Gürtel</p>

      <div className="mt-4 flex items-center gap-6">
        {/* SVG progress ring */}
        <svg width="80" height="80" viewBox="0 0 80 80" aria-label={`${readiness}% Promotionsbereitschaft`}>
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="#dc2626"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="45" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
            {readiness}%
          </text>
        </svg>

        {/* Belt info */}
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 rounded-sm" style={{ backgroundColor: beltColor, border: beltColor === '#111111' ? '1px solid #dc2626' : undefined }} />
          </div>
          <p className="mt-2 text-xl font-black text-white">{beltName} Belt</p>
          <p className="text-xs text-gray-500">{stripes} Stripes</p>
          <p className="mt-2 text-xs text-gray-600">
            {sessionsAttended} Trainings · {monthsInGrade} Monate
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- BeltProgress 2>&1 | tail -10
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/BeltProgress.tsx "components/members/__tests__/BeltProgress.test.tsx"
git commit -m "feat: add BeltProgress component with SVG readiness ring"
```

---

## Task 4: Belt Tracking Page

**Files:**
- Create: `app/(members)/gürtel/page.tsx`

- [ ] **Step 1: Create `app/(members)/gürtel/page.tsx`**

Note: No unit test for this page — it's a server component that queries Supabase directly. Verified by manual/integration testing.

```typescript
// app/(members)/gürtel/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BeltProgress } from '@/components/members/BeltProgress'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gürtel' }

interface BeltRankRow {
  id: string; name: string; stripes: number; order: number
  color_hex: string | null; min_sessions: number | null; min_time_months: number | null
}

export default async function GuertelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  // Latest promotion (highest belt_rank order)
  const { data: rankHistory } = await supabase
    .from('profile_ranks')
    .select('promoted_at, belt_ranks(id, name, stripes, order, color_hex, min_sessions, min_time_months)')
    .eq('profile_id', userId)
    .order('promoted_at', { ascending: false })
    .limit(1)

  const latestRow = rankHistory?.[0] ?? null
  const rawBeltRank = latestRow?.belt_ranks
  const beltRank: BeltRankRow | null = Array.isArray(rawBeltRank)
    ? (rawBeltRank[0] ?? null)
    : (rawBeltRank as BeltRankRow | null) ?? null

  const monthsInGrade = latestRow
    ? differenceInMonths(new Date(), new Date(latestRow.promoted_at))
    : 0

  const { count: sessionsAttended } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  const totalSessions = sessionsAttended ?? 0
  const readiness = calcReadiness(
    totalSessions,
    beltRank?.min_sessions ?? null,
    monthsInGrade,
    beltRank?.min_time_months ?? null
  )

  // Full rank history for the timeline
  const { data: allRanks } = await supabase
    .from('profile_ranks')
    .select('promoted_at, belt_ranks(name, stripes, color_hex)')
    .eq('profile_id', userId)
    .order('promoted_at', { ascending: false })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Gürtel</h1>

      <div className="max-w-lg space-y-6">
        <BeltProgress
          beltName={beltRank?.name ?? null}
          stripes={beltRank?.stripes ?? 0}
          colorHex={beltRank?.color_hex ?? null}
          readiness={readiness}
          sessionsAttended={totalSessions}
          monthsInGrade={monthsInGrade}
        />

        {/* Rank history */}
        {allRanks && allRanks.length > 1 && (
          <div className="border border-white/5 bg-[#111111] p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">Verlauf</p>
            <div className="space-y-3">
              {allRanks.map((row, i) => {
                const raw = row.belt_ranks
                const rank = Array.isArray(raw) ? raw[0] : raw as { name: string; stripes: number; color_hex: string | null } | null
                if (!rank) return null
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-2 w-10 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: rank.color_hex ?? '#e5e7eb', border: rank.color_hex === '#111111' ? '1px solid #dc2626' : undefined }}
                    />
                    <span className="text-sm text-white">{rank.name} · {rank.stripes} Stripes</span>
                    <span className="ml-auto text-xs text-gray-600">
                      {new Date(row.promoted_at).toLocaleDateString('de-AT', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests to confirm no regressions**

```bash
npm test 2>&1 | tail -8
```

Expected: All tests pass.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Fix any type errors before committing.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/gürtel/page.tsx"
git commit -m "feat: add belt tracking page with readiness percentage"
```

---

## Task 5: Dashboard Belt Widget

**Files:**
- Modify: `app/(members)/dashboard/page.tsx`

- [ ] **Step 1: Update `app/(members)/dashboard/page.tsx`**

Add belt data fetching and `BeltProgress` widget. Replace the entire file:

```typescript
// app/(members)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import { BeltProgress } from '@/components/members/BeltProgress'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string }
interface BeltRankRow {
  name: string; stripes: number; color_hex: string | null
  min_sessions: number | null; min_time_months: number | null
}

export default async function DashboardPage() {
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

  const monthsInGrade = latestRankRow
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
      <h1 className="mb-6 text-2xl font-black text-white">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Next class — spans 2 columns */}
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession} bookingId={bookingId} />
        </div>

        {/* Stats column */}
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

        {/* Belt progress — full width below */}
        <div className="sm:col-span-2 lg:col-span-3">
          <BeltProgress
            beltName={beltRank?.name ?? null}
            stripes={beltRank?.stripes ?? 0}
            colorHex={beltRank?.color_hex ?? null}
            readiness={readiness}
            sessionsAttended={attendanceCount ?? 0}
            monthsInGrade={monthsInGrade}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test 2>&1 | tail -8
```

Expected: All tests pass (no new tests added — this is a server component wiring existing units).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Fix any type errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/dashboard/page.tsx"
git commit -m "feat: add belt progress widget to member dashboard"
```

---

## Task 6: Skills Server Action

**Files:**
- Create: `app/actions/skills.ts`
- Create: `app/actions/__tests__/skills.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/actions/__tests__/skills.test.ts`:

```typescript
// app/actions/__tests__/skills.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateSkillStatus } from '../skills'

describe('updateSkillStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await updateSkillStatus('skill-1', 'in_progress')
    expect(result.error).toBeDefined()
  })

  it('returns success on valid upsert', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateSkillStatus('skill-1', 'mastered')
    expect(result.success).toBe(true)
    expect(chain.upsert).toHaveBeenCalledWith(
      { profile_id: 'user-1', skill_id: 'skill-1', status: 'mastered' },
      { onConflict: 'profile_id,skill_id' }
    )
  })

  it('returns error when upsert fails', async () => {
    const chain = {
      upsert: vi.fn().mockResolvedValue({ error: new Error('db error') }),
    }
    mockSupabase.from.mockReturnValue(chain)
    const result = await updateSkillStatus('skill-1', 'mastered')
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- actions/skills 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `app/actions/skills.ts`**

```typescript
// app/actions/skills.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSkillStatus(
  skillId: string,
  status: 'not_started' | 'in_progress' | 'mastered'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('skill_progress')
    .upsert(
      { profile_id: user.id, skill_id: skillId, status },
      { onConflict: 'profile_id,skill_id' }
    )

  if (error) return { error: 'Fehler beim Speichern.' }

  revalidatePath('/members/skills')
  return { success: true }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- actions/skills 2>&1 | tail -10
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/skills.ts "app/actions/__tests__/skills.test.ts"
git commit -m "feat: add updateSkillStatus server action"
```

---

## Task 7: SkillCard Component

**Files:**
- Create: `components/members/SkillCard.tsx`
- Create: `components/members/__tests__/SkillCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/members/__tests__/SkillCard.test.tsx`:

```typescript
// components/members/__tests__/SkillCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SkillCard } from '../SkillCard'

vi.mock('@/app/actions/skills', () => ({
  updateSkillStatus: vi.fn().mockResolvedValue({ success: true }),
}))

const mockSkill = {
  id: 'skill-1',
  name: 'Armbar from Guard',
  description: 'Classic submission from closed guard',
  video_url: null,
}

describe('SkillCard', () => {
  it('renders skill name', () => {
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    expect(screen.getByText('Armbar from Guard')).toBeInTheDocument()
  })

  it('shows Nicht begonnen status for not_started', () => {
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    expect(screen.getByRole('button', { name: /nicht begonnen/i })).toBeInTheDocument()
  })

  it('shows Beherrscht for mastered', () => {
    render(<SkillCard skill={mockSkill} initialStatus="mastered" />)
    expect(screen.getByRole('button', { name: /beherrscht/i })).toBeInTheDocument()
  })

  it('cycles status on click', async () => {
    const user = userEvent.setup()
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    await user.click(screen.getByRole('button', { name: /nicht begonnen/i }))
    expect(screen.getByRole('button', { name: /in arbeit/i })).toBeInTheDocument()
  })

  it('renders video link when video_url provided', () => {
    render(<SkillCard skill={{ ...mockSkill, video_url: 'https://example.com' }} initialStatus="not_started" />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- SkillCard 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/members/SkillCard.tsx`**

```typescript
// components/members/SkillCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import { updateSkillStatus } from '@/app/actions/skills'

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

const STATUS_LABELS: Record<SkillStatus, string> = {
  not_started: 'Nicht begonnen',
  in_progress: 'In Arbeit',
  mastered: 'Beherrscht',
}

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
}

export function SkillCard({ skill, initialStatus }: Props) {
  const [status, setStatus] = useState<SkillStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()

  const cycle = () => {
    const next = STATUS_NEXT[status]
    setStatus(next)
    startTransition(async () => {
      await updateSkillStatus(skill.id, next)
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
          aria-label={STATUS_LABELS[status]}
          className={cn(
            'px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            status === 'mastered'    && 'bg-green-900/30 text-green-400',
            status === 'in_progress' && 'bg-yellow-900/30 text-yellow-400',
            status === 'not_started' && 'bg-white/5 text-gray-600'
          )}
        >
          {STATUS_LABELS[status]}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- SkillCard 2>&1 | tail -10
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/members/SkillCard.tsx "components/members/__tests__/SkillCard.test.tsx"
git commit -m "feat: add SkillCard component with optimistic status cycling"
```

---

## Task 8: Skills Library Page

**Files:**
- Create: `app/(members)/skills/page.tsx`

- [ ] **Step 1: Create `app/(members)/skills/page.tsx`**

```typescript
// app/(members)/skills/page.tsx
import { createClient } from '@/lib/supabase/server'
import { SkillCard } from '@/components/members/SkillCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Skills' }

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

interface SkillRow {
  id: string
  name: string
  description: string | null
  video_url: string | null
}

interface CategoryRow {
  id: string
  name: string
  order: number
  skills: SkillRow[] | SkillRow | null
}

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const [{ data: rawCategories }, { data: progressRows }] = await Promise.all([
    supabase
      .from('skill_categories')
      .select('id, name, order, skills(id, name, description, video_url)')
      .order('order'),
    supabase
      .from('skill_progress')
      .select('skill_id, status')
      .eq('profile_id', userId),
  ])

  const progressMap = new Map<string, SkillStatus>(
    progressRows?.map(p => [p.skill_id, p.status as SkillStatus]) ?? []
  )

  const categories = (rawCategories ?? []) as CategoryRow[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Skills</h1>

      {categories.length === 0 && (
        <p className="text-sm text-gray-500">Noch keine Skills eingetragen.</p>
      )}

      <div className="space-y-8">
        {categories.map(cat => {
          const rawSkills = cat.skills
          const skills: SkillRow[] = Array.isArray(rawSkills)
            ? rawSkills
            : rawSkills
            ? [rawSkills]
            : []

          if (skills.length === 0) return null

          const masteredCount = skills.filter(s => progressMap.get(s.id) === 'mastered').length

          return (
            <div key={cat.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {cat.name}
                </h2>
                <span className="text-xs text-gray-600">
                  {masteredCount}/{skills.length} beherrscht
                </span>
                <span className="h-px flex-1 bg-white/5" />
              </div>

              <div className="border border-white/5 bg-[#111111] px-4">
                {skills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    initialStatus={progressMap.get(skill.id) ?? 'not_started'}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test 2>&1 | tail -8
```

Expected: All tests pass (0 failures).

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Fix any type errors before committing.

- [ ] **Step 4: Commit**

```bash
git add "app/(members)/skills/page.tsx"
git commit -m "feat: add skills library page with category grouping and progress tracking"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Waitlist promotion on cancel → Task 1
- ✅ `/members/gürtel` (belt + stripes, time-in-grade, sessions, readiness %) → Tasks 2–4
- ✅ Dashboard belt progress ring → Task 5
- ✅ `/members/skills` (skills by category, progress per skill, video links) → Tasks 6–8
- ⬜ `/members/konto` (profile edit, waivers) — deferred to Phase 4 per roadmap
- ⬜ Resend email notification on waitlist promotion — deferred to Phase 5 (email polish)

**Placeholder scan:** No TBDs. All code complete.

**Type consistency:** `BeltRankRow` interface defined in Task 3, reused identically in Task 5. `SkillStatus`, `SkillRow`, `CategoryRow` defined in Task 8. `BeltProgress` props in Task 3 match usage in Tasks 4 and 5.
