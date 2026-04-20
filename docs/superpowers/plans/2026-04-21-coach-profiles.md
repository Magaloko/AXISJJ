# Coach Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded CoachCard with dynamic coach profile cards fetched from a new `coach_profiles` Supabase table, managed inline in the Mitglieder admin panel.

**Architecture:** New `coach_profiles` table (FK → profiles) holds bio, achievements, and display settings. Two server actions cover admin CRUD and public read. The landing page CoachSection becomes async, rendering a client CoachSlider fed from the DB. MemberEditPanel gains a "Website-Profil" section visible for coach/owner roles.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, Framer Motion, Vitest + React Testing Library, Lucide icons

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/20260421_coach_profiles.sql` | Create table, RLS, seed Shamsudin |
| `types/supabase.ts` | Add `coach_profiles` table types |
| `app/actions/coach-profile-admin.ts` | New: `getCoachProfile`, `upsertCoachProfile` |
| `app/actions/__tests__/coach-profile-admin.test.ts` | New: tests for both actions |
| `app/actions/public-coaches.ts` | New: `getPublicCoaches` |
| `app/actions/members.ts` | Modify: auto-create coach_profiles row on role→coach |
| `app/actions/__tests__/members.test.ts` | Modify: update mock for role-change test |
| `components/ui/coach-profile-card.tsx` | New: data-driven card (replaces hardcoded CoachCard) |
| `components/public/CoachSlider.tsx` | New: client slider wrapper |
| `components/public/CoachSection.tsx` | Modify: async, fetch from DB, render CoachSlider |
| `components/public/__tests__/CoachSection.test.tsx` | Modify: mock getPublicCoaches |

---

## Task 1: Migration and Types

**Files:**
- Create: `supabase/migrations/20260421_coach_profiles.sql`
- Modify: `types/supabase.ts`

### Step 1.1 — Create migration file

- [ ] Create `supabase/migrations/20260421_coach_profiles.sql` with this content:

```sql
-- coach_profiles: public website profiles for coaches
CREATE TABLE IF NOT EXISTS coach_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization  text,
  bio             text,
  achievements    text,
  show_on_website boolean     NOT NULL DEFAULT false,
  display_order   integer     NOT NULL DEFAULT 99,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible profiles (public landing page)
CREATE POLICY "coach_profiles_public_read" ON coach_profiles
  FOR SELECT USING (show_on_website = true);

-- Owners can read ALL profiles (to manage them in admin)
CREATE POLICY "coach_profiles_owner_read" ON coach_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owners can insert, update, delete
CREATE POLICY "coach_profiles_owner_write" ON coach_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Grant access to authenticated users (RLS enforces row-level restrictions)
GRANT SELECT, INSERT, UPDATE, DELETE ON coach_profiles TO authenticated;

-- Seed Shamsudin (finds by name; no-op if already exists)
INSERT INTO coach_profiles (profile_id, specialization, bio, achievements, show_on_website, display_order)
SELECT
  id,
  'Gi & No-Gi · Head Coach',
  'Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Technik, Disziplin und Respekt — auf und abseits der Matte.',
  'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver · Mehrfacher österreichischer Champion',
  true,
  1
FROM profiles
WHERE full_name ILIKE '%Baisarov%'
LIMIT 1
ON CONFLICT (profile_id) DO UPDATE SET
  specialization  = EXCLUDED.specialization,
  bio             = EXCLUDED.bio,
  achievements    = EXCLUDED.achievements,
  show_on_website = EXCLUDED.show_on_website,
  display_order   = EXCLUDED.display_order;
```

### Step 1.2 — Apply migration

- [ ] Run: `npx supabase db push` (or apply via Supabase dashboard SQL editor)
- Expected: migration runs without errors, `coach_profiles` table exists, Shamsudin's row is seeded

### Step 1.3 — Add types to `types/supabase.ts`

- [ ] Open `types/supabase.ts`. Find the `Tables` section (it's a large object with `attendances`, `belt_ranks`, etc.). Add `coach_profiles` **before** `documents` (alphabetical order):

```ts
      coach_profiles: {
        Row: {
          id: string
          profile_id: string
          specialization: string | null
          bio: string | null
          achievements: string | null
          show_on_website: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          specialization?: string | null
          bio?: string | null
          achievements?: string | null
          show_on_website?: boolean
          display_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['coach_profiles']['Insert']>
        Relationships: [
          {
            foreignKeyName: "coach_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
```

### Step 1.4 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: same errors as baseline (3 pre-existing Hero.test.tsx errors), no new errors

### Step 1.5 — Commit

- [ ] Run:
```bash
git add supabase/migrations/20260421_coach_profiles.sql types/supabase.ts
git commit -m "feat: add coach_profiles table, RLS, and types"
```

---

## Task 2: Admin Server Actions

**Files:**
- Create: `app/actions/coach-profile-admin.ts`
- Create: `app/actions/__tests__/coach-profile-admin.test.ts`

### Step 2.1 — Write failing tests first

- [ ] Create `app/actions/__tests__/coach-profile-admin.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { getCoachProfile, upsertCoachProfile } from '../coach-profile-admin'

function ownerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
  }
}

function nonOwnerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
  }
}

describe('getCoachProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns null for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(nonOwnerChain())
    const result = await getCoachProfile('profile-1')
    expect(result).toBeNull()
  })

  it('returns null when no profile row exists', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    mockSupabase.from.mockReturnValueOnce(fetchChain)
    const result = await getCoachProfile('profile-1')
    expect(result).toBeNull()
  })

  it('returns mapped profile data', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fetchChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          profile_id: 'profile-1',
          specialization: 'Head Coach',
          bio: 'Bio text',
          achievements: 'Champion',
          show_on_website: true,
          display_order: 1,
        },
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(fetchChain)
    const result = await getCoachProfile('profile-1')
    expect(result).toEqual({
      profileId: 'profile-1',
      specialization: 'Head Coach',
      bio: 'Bio text',
      achievements: 'Champion',
      showOnWebsite: true,
      displayOrder: 1,
    })
  })
})

describe('upsertCoachProfile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns error for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(nonOwnerChain())
    const result = await upsertCoachProfile('profile-1', { showOnWebsite: true })
    expect(result.error).toBeTruthy()
  })

  it('returns error on db failure', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await upsertCoachProfile('profile-1', {})
    expect(result.error).toBeTruthy()
  })

  it('returns success and calls upsert with correct payload', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await upsertCoachProfile('profile-1', {
      specialization: 'Head Coach',
      bio: 'Bio',
      achievements: 'Champion',
      showOnWebsite: true,
      displayOrder: 1,
    })
    expect(result.success).toBe(true)
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      {
        profile_id: 'profile-1',
        specialization: 'Head Coach',
        bio: 'Bio',
        achievements: 'Champion',
        show_on_website: true,
        display_order: 1,
      },
      { onConflict: 'profile_id' }
    )
  })
})
```

### Step 2.2 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/coach-profile-admin.test.ts`
- Expected: FAIL — module not found

### Step 2.3 — Implement `app/actions/coach-profile-admin.ts`

- [ ] Create `app/actions/coach-profile-admin.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface CoachProfileData {
  profileId: string
  specialization: string | null
  bio: string | null
  achievements: string | null
  showOnWebsite: boolean
  displayOrder: number
}

export async function getCoachProfile(profileId: string): Promise<CoachProfileData | null> {
  const auth = await assertOwner()
  if ('error' in auth) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_profiles')
    .select('profile_id, specialization, bio, achievements, show_on_website, display_order')
    .eq('profile_id', profileId)
    .single()

  if (!data) return null
  return {
    profileId: data.profile_id,
    specialization: data.specialization,
    bio: data.bio,
    achievements: data.achievements,
    showOnWebsite: data.show_on_website,
    displayOrder: data.display_order,
  }
}

export async function upsertCoachProfile(
  profileId: string,
  data: {
    specialization?: string | null
    bio?: string | null
    achievements?: string | null
    showOnWebsite?: boolean
    displayOrder?: number
  },
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('coach_profiles')
    .upsert(
      {
        profile_id: profileId,
        specialization: data.specialization ?? null,
        bio: data.bio ?? null,
        achievements: data.achievements ?? null,
        show_on_website: data.showOnWebsite ?? false,
        display_order: data.displayOrder ?? 99,
      },
      { onConflict: 'profile_id' },
    )

  if (error) return { error: 'Profil konnte nicht gespeichert werden.' }

  revalidatePath('/')
  revalidatePath('/admin/mitglieder')
  return { success: true }
}
```

### Step 2.4 — Run tests to verify they pass

- [ ] Run: `npx vitest run app/actions/__tests__/coach-profile-admin.test.ts`
- Expected: all 6 tests PASS

### Step 2.5 — Commit

- [ ] Run:
```bash
git add app/actions/coach-profile-admin.ts app/actions/__tests__/coach-profile-admin.test.ts
git commit -m "feat: add getCoachProfile and upsertCoachProfile server actions"
```

---

## Task 3: Public Server Action

**Files:**
- Create: `app/actions/public-coaches.ts`

*No unit tests for this action — it has no auth logic to test, and the nested Supabase join is integration territory.*

### Step 3.1 — Create `app/actions/public-coaches.ts`

- [ ] Create `app/actions/public-coaches.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export interface CoachPublicProfile {
  profileId: string
  name: string
  avatarUrl: string | null
  specialization: string | null
  bio: string | null
  achievements: string | null
  beltName: string | null
  beltColorHex: string | null
  displayOrder: number
}

export async function getPublicCoaches(): Promise<CoachPublicProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      profile_id,
      specialization,
      bio,
      achievements,
      display_order,
      profiles!inner(
        full_name,
        avatar_url,
        profile_ranks(
          promoted_at,
          belt_ranks(name, color_hex)
        )
      )
    `)
    .eq('show_on_website', true)
    .order('display_order', { ascending: true })

  if (error || !data) return []

  return data.map(row => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const ranks = (profile?.profile_ranks ?? []) as {
      promoted_at: string
      belt_ranks: { name: string; color_hex: string | null } | { name: string; color_hex: string | null }[] | null
    }[]

    const sorted = [...ranks].sort(
      (a, b) => new Date(b.promoted_at).getTime() - new Date(a.promoted_at).getTime(),
    )
    const latestRankBelts = sorted[0]?.belt_ranks ?? null
    const belt = Array.isArray(latestRankBelts) ? latestRankBelts[0] : latestRankBelts

    return {
      profileId: row.profile_id,
      name: profile?.full_name ?? 'Coach',
      avatarUrl: profile?.avatar_url ?? null,
      specialization: row.specialization,
      bio: row.bio,
      achievements: row.achievements,
      beltName: belt?.name ?? null,
      beltColorHex: belt?.color_hex ?? null,
      displayOrder: row.display_order,
    }
  })
}
```

### Step 3.2 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 3.3 — Commit

- [ ] Run:
```bash
git add app/actions/public-coaches.ts
git commit -m "feat: add getPublicCoaches public server action"
```

---

## Task 4: Auto-create coach_profiles on role change

**Files:**
- Modify: `app/actions/members.ts`
- Modify: `app/actions/__tests__/members.test.ts`

### Step 4.1 — Update the `updateMemberRole` test

- [ ] Open `app/actions/__tests__/members.test.ts`. Find the `'updates role on success'` test inside `describe('updateMemberRole')`. The current test mocks 3 `from()` calls. After our change, when role='coach', there is a 4th call to upsert into `coach_profiles`. Update that test:

```ts
  it('updates role on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const existing = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Max', role: 'member' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(existing)
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    // 4th call: coach_profiles upsert (only when new role is 'coach')
    const coachProfileUpsert = { upsert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(coachProfileUpsert)
    const res = await updateMemberRole('p-1', 'coach')
    expect(res.success).toBe(true)
    expect(upd.update).toHaveBeenCalledWith({ role: 'coach' })
  })
```

Also add a test confirming no coach_profiles upsert when role='member':

```ts
  it('does not upsert coach_profiles when role is member', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const existing = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { full_name: 'Max', role: 'coach' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(existing)
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateMemberRole('p-1', 'member')
    expect(res.success).toBe(true)
    // from() should have been called exactly 3 times (no coach_profiles upsert)
    expect(mockSupabase.from).toHaveBeenCalledTimes(3)
  })
```

### Step 4.2 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/members.test.ts`
- Expected: `'updates role on success'` FAILS (mock call count mismatch)

### Step 4.3 — Update `updateMemberRole` in `app/actions/members.ts`

- [ ] Open `app/actions/members.ts`. Find the `return { success: true }` at the end of `updateMemberRole`. Add the coach_profiles upsert **before** the return statement, after the audit log block:

```ts
  // Auto-create coach_profiles row when promoting to coach
  if (role === 'coach') {
    await supabase
      .from('coach_profiles')
      .upsert({ profile_id: profileId }, { onConflict: 'profile_id' })
  }

  return { success: true }
```

### Step 4.4 — Run tests to verify they pass

- [ ] Run: `npx vitest run app/actions/__tests__/members.test.ts`
- Expected: all tests PASS

### Step 4.5 — Commit

- [ ] Run:
```bash
git add app/actions/members.ts app/actions/__tests__/members.test.ts
git commit -m "feat: auto-create coach_profiles row when member is promoted to coach"
```

---

## Task 5: Admin UI — Website-Profil section in MemberEditPanel

**Files:**
- Modify: `components/admin/MemberEditPanel.tsx`

### Step 5.1 — Add the Website-Profil section

- [ ] Open `components/admin/MemberEditPanel.tsx`. Find the existing React import line:
```ts
import { useState, useTransition } from 'react'
```
Change it to add `useEffect`:
```ts
import { useState, useTransition, useEffect } from 'react'
```
Also add the coach profile action import after the existing imports:
```ts
import { getCoachProfile, upsertCoachProfile } from '@/app/actions/coach-profile-admin'
```

- [ ] Inside `MemberEditPanel`, add state for the coach profile form. Add after the existing `const [error, setError]` line:

```ts
  const [coachForm, setCoachForm] = useState({
    specialization: '',
    bio: '',
    achievements: '',
    showOnWebsite: false,
    displayOrder: 99,
  })
  const [coachSaveError, setCoachSaveError] = useState<string | null>(null)
  const [coachSaved, setCoachSaved] = useState(false)
  const [isCoachPending, startCoachTransition] = useTransition()
  const isCoach = member.role === 'coach' || member.role === 'owner'
```

- [ ] After the existing `const readOnly = viewerRole !== 'owner'` line, add a `useEffect` to load the coach profile:

```ts
  useEffect(() => {
    if (!isCoach || readOnly) return
    getCoachProfile(member.id).then(profile => {
      if (!profile) return
      setCoachForm({
        specialization: profile.specialization ?? '',
        bio: profile.bio ?? '',
        achievements: profile.achievements ?? '',
        showOnWebsite: profile.showOnWebsite,
        displayOrder: profile.displayOrder,
      })
    })
  }, [member.id, isCoach, readOnly])
```

- [ ] Add a `saveCoachProfile` function after the existing `save` function:

```ts
  function saveCoachProfile() {
    setCoachSaveError(null)
    setCoachSaved(false)
    startCoachTransition(async () => {
      const result = await upsertCoachProfile(member.id, {
        specialization: coachForm.specialization || null,
        bio: coachForm.bio || null,
        achievements: coachForm.achievements || null,
        showOnWebsite: coachForm.showOnWebsite,
        displayOrder: coachForm.displayOrder,
      })
      if (result.error) { setCoachSaveError(result.error); return }
      setCoachSaved(true)
    })
  }
```

- [ ] Find the closing `</div>` of the last section in the panel (after `MemberSkillsManager` or similar). Before that closing div, add the Website-Profil section:

```tsx
      {isCoach && !readOnly && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Website-Profil
          </p>
          {coachSaveError && <p className="mb-3 text-xs text-destructive">{coachSaveError}</p>}
          {coachSaved && <p className="mb-3 text-xs text-primary">Gespeichert.</p>}

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={coachForm.showOnWebsite}
                onChange={e => setCoachForm({ ...coachForm, showOnWebsite: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm">Auf Landing Page anzeigen</span>
            </label>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Spezialisierung</label>
              <input
                className="w-full border border-border bg-background p-2 text-sm"
                placeholder="z.B. Gi & No-Gi · Head Coach"
                value={coachForm.specialization}
                onChange={e => setCoachForm({ ...coachForm, specialization: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bio</label>
              <textarea
                className="w-full border border-border bg-background p-2 text-sm resize-none"
                rows={3}
                value={coachForm.bio}
                onChange={e => setCoachForm({ ...coachForm, bio: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Erfolge</label>
              <textarea
                className="w-full border border-border bg-background p-2 text-sm resize-none"
                rows={2}
                placeholder="z.B. IBJJF European Silver · Österreichischer Champion"
                value={coachForm.achievements}
                onChange={e => setCoachForm({ ...coachForm, achievements: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Reihenfolge (1 = zuerst)</label>
              <input
                type="number"
                min={1}
                max={99}
                className="w-24 border border-border bg-background p-2 text-sm"
                value={coachForm.displayOrder}
                onChange={e => setCoachForm({ ...coachForm, displayOrder: Number(e.target.value) || 99 })}
              />
            </div>

            <button
              onClick={saveCoachProfile}
              disabled={isCoachPending}
              className="bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {isCoachPending ? 'Speichern…' : 'Website-Profil speichern'}
            </button>
          </div>
        </div>
      )}
```

### Step 5.2 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 5.3 — Commit

- [ ] Run:
```bash
git add components/admin/MemberEditPanel.tsx
git commit -m "feat: add Website-Profil section to MemberEditPanel for coach/owner roles"
```

---

## Task 6: CoachProfileCard + CoachSlider + CoachSection update

**Files:**
- Create: `components/ui/coach-profile-card.tsx`
- Create: `components/public/CoachSlider.tsx`
- Modify: `components/public/CoachSection.tsx`
- Modify: `components/public/__tests__/CoachSection.test.tsx`

### Step 6.1 — Create `components/ui/coach-profile-card.tsx`

- [ ] Create `components/ui/coach-profile-card.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { CoachPublicProfile } from '@/app/actions/public-coaches'

const BELT_ORDER = [
  { label: 'White',  color: '#e5e7eb' },
  { label: 'Blue',   color: '#1d4ed8' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Brown',  color: '#78350f' },
  { label: 'Black',  color: '#111111' },
]

function getBeltIndex(beltName: string | null): number {
  if (!beltName) return BELT_ORDER.length - 1 // default to black for coaches
  const lower = beltName.toLowerCase()
  const idx = BELT_ORDER.findIndex(b => lower.includes(b.label.toLowerCase()))
  return idx === -1 ? BELT_ORDER.length - 1 : idx
}

interface Props {
  coach: CoachPublicProfile
  className?: string
}

export function CoachProfileCard({ coach, className }: Props) {
  const activeBeltIdx = getBeltIndex(coach.beltName)

  function BeltBar() {
    return (
      <div className="flex items-center gap-2">
        {BELT_ORDER.map((belt, i) => (
          <div
            key={belt.label}
            title={`${belt.label} Belt`}
            className={cn('h-2 flex-1 rounded-sm transition-opacity', i > activeBeltIdx ? 'opacity-20' : '')}
            style={{
              background: belt.color,
              border: belt.label === 'Black' && i <= activeBeltIdx ? '1px solid oklch(58% 0.21 28)' : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  const photo = coach.avatarUrl ?? '/images/coach-portrait.jpg'
  const role = coach.specialization ?? 'Coach'

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: photo left overlapping card right */}
      <div className="hidden md:flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-[360px] h-[460px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src={photo}
            alt={`${coach.name} — AXIS Jiu-Jitsu`}
            fill
            className="object-cover object-top"
            sizes="360px"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 bg-background rounded-2xl shadow-xl border border-border/40 p-8 pl-24 ml-[-80px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {role}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground mb-2">
            {coach.name.toUpperCase()}
          </h2>

          {coach.achievements && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-6">
              {coach.achievements}
            </p>
          )}

          {coach.bio && (
            <div className="space-y-3 text-sm text-muted-foreground mb-8">
              <p>{coach.bio}</p>
            </div>
          )}

          <BeltBar />
        </motion.div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl mb-6"
        >
          <Image
            src={photo}
            alt={`${coach.name} — AXIS Jiu-Jitsu`}
            width={400}
            height={533}
            className="w-full h-full object-cover object-top"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-background rounded-2xl shadow-xl border border-border/40 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {role}
            </span>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1">
            {coach.name.toUpperCase()}
          </h2>

          {coach.achievements && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4">
              {coach.achievements}
            </p>
          )}

          {coach.bio && (
            <p className="text-sm text-muted-foreground mb-6">{coach.bio}</p>
          )}

          <BeltBar />
        </motion.div>
      </div>
    </div>
  )
}
```

### Step 6.2 — Create `components/public/CoachSlider.tsx`

- [ ] Create `components/public/CoachSlider.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CoachProfileCard } from '@/components/ui/coach-profile-card'
import { cn } from '@/lib/utils/cn'
import type { CoachPublicProfile } from '@/app/actions/public-coaches'

interface Props {
  coaches: CoachPublicProfile[]
}

export function CoachSlider({ coaches }: Props) {
  const [index, setIndex] = useState(0)

  if (coaches.length === 0) return null
  if (coaches.length === 1) return <CoachProfileCard coach={coaches[0]} />

  const prev = () => setIndex(i => (i - 1 + coaches.length) % coaches.length)
  const next = () => setIndex(i => (i + 1) % coaches.length)

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={coaches[index].profileId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
        >
          <CoachProfileCard coach={coaches[index]} />
        </motion.div>
      </AnimatePresence>

      {/* Arrows — only visible on desktop where card has room */}
      <button
        onClick={prev}
        aria-label="Vorheriger Coach"
        className="absolute left-0 top-1/2 hidden -translate-y-1/2 -translate-x-10 rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground md:block"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Nächster Coach"
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-10 rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground md:block"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="mt-8 flex justify-center gap-2">
        {coaches.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Coach ${i + 1}`}
            className={cn(
              'h-1.5 rounded-sm transition-all',
              i === index ? 'w-8 bg-primary' : 'w-4 bg-muted',
            )}
          />
        ))}
      </div>

      {/* Mobile prev/next buttons below dots */}
      <div className="mt-4 flex justify-center gap-4 md:hidden">
        <button onClick={prev} className="border border-border p-2 text-muted-foreground">
          <ChevronLeft size={16} />
        </button>
        <button onClick={next} className="border border-border p-2 text-muted-foreground">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
```

### Step 6.3 — Update `components/public/CoachSection.tsx`

- [ ] Replace the entire contents of `components/public/CoachSection.tsx` with:

```tsx
import { getPublicCoaches } from '@/app/actions/public-coaches'
import { CoachSlider } from './CoachSlider'

export async function CoachSection() {
  const coaches = await getPublicCoaches()

  if (coaches.length === 0) return null

  return (
    <section id="team" className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-10 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Team · Coach
        </p>
        <CoachSlider coaches={coaches} />
      </div>
    </section>
  )
}
```

### Step 6.4 — Update `components/public/__tests__/CoachSection.test.tsx`

- [ ] Replace the entire file with:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock the server action
vi.mock('@/app/actions/public-coaches', () => ({
  getPublicCoaches: vi.fn().mockResolvedValue([
    {
      profileId: 'p-1',
      name: 'Shamsudin Baisarov',
      avatarUrl: null,
      specialization: 'Gi & No-Gi · Head Coach',
      bio: 'Mit jahrelanger Erfahrung auf internationalem Niveau.',
      achievements: 'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver',
      beltName: 'Black Belt',
      beltColorHex: '#111111',
      displayOrder: 1,
    },
  ]),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CoachSection } from '../CoachSection'

describe('CoachSection', () => {
  it('renders coach name', async () => {
    const jsx = await CoachSection()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/shamsudin baisarov/i)).toBeInTheDocument()
  })

  it('renders specialization', async () => {
    const jsx = await CoachSection()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/head coach/i)).toBeInTheDocument()
  })

  it('renders achievements', async () => {
    const jsx = await CoachSection()
    render(jsx as React.ReactElement)
    expect(screen.getByText(/ibjjf european silver/i)).toBeInTheDocument()
  })

  it('renders nothing when no coaches', async () => {
    const { getPublicCoaches } = await import('@/app/actions/public-coaches')
    vi.mocked(getPublicCoaches).mockResolvedValueOnce([])
    const jsx = await CoachSection()
    expect(jsx).toBeNull()
  })
})
```

### Step 6.5 — Run tests

- [ ] Run: `npx vitest run components/public/__tests__/CoachSection.test.tsx`
- Expected: 4 tests PASS

### Step 6.6 — Run full test suite

- [ ] Run: `npx vitest run`
- Expected: same pass/fail ratio as before (pre-existing failures only)

### Step 6.7 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 6.8 — Commit

- [ ] Run:
```bash
git add components/ui/coach-profile-card.tsx components/public/CoachSlider.tsx components/public/CoachSection.tsx components/public/__tests__/CoachSection.test.tsx
git commit -m "feat: dynamic coach slider on landing page with CoachProfileCard and CoachSlider"
```

### Step 6.9 — Push to deploy

- [ ] Run: `git push origin main`
- Expected: Vercel auto-deploys; coach section on landing page now shows Shamsudin's data from DB
