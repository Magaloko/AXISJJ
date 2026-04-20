# Tournament System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tournament calendar where any coach can create tournaments (owner approves), members can register with weight category + gi/no-gi + notes (coach approves registrations), and approved upcoming tournaments appear on the public landing page with a participants slider.

**Architecture:** Two new tables (`tournaments`, `tournament_registrations`) with RLS. Server actions handle creation/approval/registration workflows. New admin page `/admin/turniere`, new member page `/dashboard/turniere`, new public landing section `TournamentSection`. Two-level approval: owner approves tournaments, coach approves registrations.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, Vitest + React Testing Library, Lucide icons, Framer Motion (for slider transitions)

---

## File Map

| File | Purpose |
|------|---------|
| `supabase/migrations/20260421_tournaments.sql` | Tables, enums, RLS policies |
| `types/supabase.ts` | Add tournament tables to Database type |
| `app/actions/tournaments.ts` | Tournament CRUD server actions |
| `app/actions/tournaments.schema.ts` | Zod validation schemas |
| `app/actions/__tests__/tournaments.test.ts` | Action tests |
| `app/actions/tournament-registrations.ts` | Registration CRUD actions |
| `app/actions/__tests__/tournament-registrations.test.ts` | Registration action tests |
| `app/actions/public-tournaments.ts` | Public read action (no auth) |
| `components/admin/TournamentForm.tsx` | Create/edit side panel |
| `components/admin/TournamentList.tsx` | Admin list with actions |
| `components/admin/RegistrationReviewPanel.tsx` | Coach registration approval UI |
| `app/(admin)/admin/turniere/page.tsx` | Admin page |
| `components/members/MemberTournamentList.tsx` | Member-side list + registration form |
| `app/(members)/dashboard/turniere/page.tsx` | Member page |
| `components/public/TournamentCard.tsx` | Public display card with participant slider |
| `components/public/TournamentSection.tsx` | Landing page section wrapper |
| `components/admin/AdminNav.tsx` | Add Turniere to sidebar + coach bottom bar + owner Mehr sheet |
| `components/members/MemberNav.tsx` | Add Turniere to member nav |
| `app/(public)/page.tsx` | Add TournamentSection to homepage |

---

## Task 1: Migration + Types

**Files:**
- Create: `supabase/migrations/20260421_tournaments.sql`
- Modify: `types/supabase.ts`

### Step 1.1 — Create migration

- [ ] Create `supabase/migrations/20260421_tournaments.sql`:

```sql
-- Tournaments + registrations
CREATE TABLE IF NOT EXISTS tournaments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  date                  date NOT NULL,
  end_date              date,
  location              text NOT NULL,
  type                  text NOT NULL DEFAULT 'external' CHECK (type IN ('internal','external')),
  description           text,
  registration_deadline date,
  coach_id              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'pending_approval'
                        CHECK (status IN ('pending_approval','approved','cancelled')),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_category text,
  gi_nogi         text CHECK (gi_nogi IN ('gi','nogi','both')),
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','denied')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, profile_id)
);

CREATE INDEX IF NOT EXISTS tournaments_date_idx ON tournaments (date);
CREATE INDEX IF NOT EXISTS tournaments_status_idx ON tournaments (status);
CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_idx ON tournament_registrations (tournament_id);
CREATE INDEX IF NOT EXISTS tournament_registrations_profile_idx ON tournament_registrations (profile_id);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can SELECT approved future tournaments
CREATE POLICY "tournaments_public_read" ON tournaments
  FOR SELECT USING (status = 'approved' AND date >= CURRENT_DATE);

-- Coaches and owners can SELECT all tournaments
CREATE POLICY "tournaments_staff_read" ON tournaments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Coaches can INSERT tournaments (status will be set by application)
CREATE POLICY "tournaments_staff_insert" ON tournaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Coaches can UPDATE their own pending tournaments; owners can UPDATE any
CREATE POLICY "tournaments_coach_update_own" ON tournaments
  FOR UPDATE USING (
    (coach_id = auth.uid() AND status = 'pending_approval')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  )
  WITH CHECK (
    (coach_id = auth.uid() AND status = 'pending_approval')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owner can DELETE
CREATE POLICY "tournaments_owner_delete" ON tournaments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Registration RLS
-- Members can SELECT their own registrations
CREATE POLICY "tournament_regs_own_read" ON tournament_registrations
  FOR SELECT USING (profile_id = auth.uid());

-- Staff can SELECT all registrations
CREATE POLICY "tournament_regs_staff_read" ON tournament_registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Public (anon + authenticated) can read approved registrations for approved tournaments (for landing page participants)
CREATE POLICY "tournament_regs_public_approved" ON tournament_registrations
  FOR SELECT USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.status = 'approved' AND t.date >= CURRENT_DATE
    )
  );

-- Members can INSERT their own registrations
CREATE POLICY "tournament_regs_own_insert" ON tournament_registrations
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Members can UPDATE their own pending registrations (re-register after deny)
CREATE POLICY "tournament_regs_own_update" ON tournament_registrations
  FOR UPDATE USING (profile_id = auth.uid() AND status IN ('pending','denied'))
  WITH CHECK (profile_id = auth.uid());

-- Staff can UPDATE registration status
CREATE POLICY "tournament_regs_staff_update" ON tournament_registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Grants
GRANT SELECT ON tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tournaments TO authenticated;
GRANT SELECT ON tournament_registrations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tournament_registrations TO authenticated;
```

### Step 1.2 — Apply migration via Supabase MCP

- [ ] Apply migration using `apply_migration` MCP tool on project `wstdjhjybrongxfgystx`.
- Expected: both tables + RLS policies exist.

### Step 1.3 — Add types to `types/supabase.ts`

- [ ] Find the `Tables:` section and add both tables in alphabetical order:

```ts
      tournaments: {
        Row: {
          id: string
          name: string
          date: string
          end_date: string | null
          location: string
          type: 'internal' | 'external'
          description: string | null
          registration_deadline: string | null
          coach_id: string | null
          status: 'pending_approval' | 'approved' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          end_date?: string | null
          location: string
          type?: 'internal' | 'external'
          description?: string | null
          registration_deadline?: string | null
          coach_id?: string | null
          status?: 'pending_approval' | 'approved' | 'cancelled'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>
        Relationships: [
          {
            foreignKeyName: "tournaments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tournament_registrations: {
        Row: {
          id: string
          tournament_id: string
          profile_id: string
          weight_category: string | null
          gi_nogi: 'gi' | 'nogi' | 'both' | null
          notes: string | null
          status: 'pending' | 'approved' | 'denied'
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          profile_id: string
          weight_category?: string | null
          gi_nogi?: 'gi' | 'nogi' | 'both' | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'denied'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tournament_registrations']['Insert']>
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
```

### Step 1.4 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 1.5 — Commit

```bash
git add supabase/migrations/20260421_tournaments.sql types/supabase.ts
git commit -m "feat: add tournaments and tournament_registrations tables with RLS"
```

---

## Task 2: Tournament Server Actions + Schema

**Files:**
- Create: `app/actions/tournaments.schema.ts`
- Create: `app/actions/tournaments.ts`
- Create: `app/actions/__tests__/tournaments.test.ts`

### Step 2.1 — Create validation schema

- [ ] Create `app/actions/tournaments.schema.ts`:

```ts
import { z } from 'zod'

export const tournamentInputSchema = z.object({
  name: z.string().min(1, 'Name ist Pflicht').max(200),
  date: z.string().min(1, 'Datum ist Pflicht'),
  end_date: z.string().optional().nullable(),
  location: z.string().min(1, 'Ort ist Pflicht').max(200),
  type: z.enum(['internal', 'external']),
  description: z.string().max(2000).optional().nullable(),
  registration_deadline: z.string().optional().nullable(),
})

export type TournamentInput = z.infer<typeof tournamentInputSchema>
```

### Step 2.2 — Write failing tests

- [ ] Create `app/actions/__tests__/tournaments.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import {
  createTournament, updateTournament, approveTournament,
  cancelTournament, getTournamentsForAdmin,
} from '../tournaments'

function roleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

const validInput = {
  name: 'IBJJF European',
  date: '2026-06-01',
  location: 'Lisbon',
  type: 'external' as const,
}

describe('createTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await createTournament(validInput)
    expect(result.error).toBeTruthy()
  })

  it('coach creates with pending_approval status', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'tourn-1' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createTournament(validInput)
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'IBJJF European',
        status: 'pending_approval',
        coach_id: 'user-1',
      }),
    )
  })

  it('owner creates with approved status', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'tourn-1' }, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createTournament(validInput)
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' }),
    )
  })

  it('rejects invalid input', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const result = await createTournament({ ...validInput, name: '' })
    expect(result.error).toBeTruthy()
  })
})

describe('approveTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const result = await approveTournament('t-1')
    expect(result.error).toBeTruthy()
  })

  it('updates status to approved for owner', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await approveTournament('t-1')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'approved' })
  })
})

describe('cancelTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await cancelTournament('t-1')
    expect(result.error).toBeTruthy()
  })

  it('sets status to cancelled', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('owner'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await cancelTournament('t-1')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'cancelled' })
  })
})

describe('getTournamentsForAdmin', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('returns empty array for non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await getTournamentsForAdmin()
    expect(result).toEqual([])
  })

  it('returns tournaments for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const listChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 't-1', name: 'Test', date: '2026-06-01', end_date: null,
          location: 'Wien', type: 'internal', description: null,
          registration_deadline: null, coach_id: 'coach-1', status: 'approved',
          created_at: '2026-04-21',
        }],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(listChain)
    const result = await getTournamentsForAdmin()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test')
  })
})
```

### Step 2.3 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/tournaments.test.ts`
- Expected: FAIL — module not found

### Step 2.4 — Implement `app/actions/tournaments.ts`

- [ ] Create `app/actions/tournaments.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { tournamentInputSchema, type TournamentInput } from './tournaments.schema'

export interface Tournament {
  id: string
  name: string
  date: string
  end_date: string | null
  location: string
  type: 'internal' | 'external'
  description: string | null
  registration_deadline: string | null
  coach_id: string | null
  status: 'pending_approval' | 'approved' | 'cancelled'
  created_at: string
}

async function getCallerRole(): Promise<'member' | 'coach' | 'owner' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return (data?.role as 'member' | 'coach' | 'owner' | null) ?? null
}

export async function createTournament(
  input: TournamentInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = tournamentInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: 'Keine Berechtigung.' }

  const status = role === 'owner' ? 'approved' : 'pending_approval'

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location,
      type: parsed.data.type,
      description: parsed.data.description?.trim() || null,
      registration_deadline: parsed.data.registration_deadline || null,
      coach_id: user.id,
      status,
    })
    .select('id')
    .single()

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true, id: data.id }
}

export async function updateTournament(
  id: string,
  input: TournamentInput,
): Promise<{ success?: true; error?: string }> {
  const parsed = tournamentInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: 'Keine Berechtigung.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date || null,
      location: parsed.data.location,
      type: parsed.data.type,
      description: parsed.data.description?.trim() || null,
      registration_deadline: parsed.data.registration_deadline || null,
    })
    .eq('id', id)

  if (error) return { error: 'Update fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function approveTournament(id: string): Promise<{ success?: true; error?: string }> {
  const role = await getCallerRole()
  if (role !== 'owner') return { error: 'Nur Owner kann genehmigen.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) return { error: 'Genehmigung fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function cancelTournament(id: string): Promise<{ success?: true; error?: string }> {
  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return { error: 'Keine Berechtigung.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: 'Absage fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function getTournamentsForAdmin(): Promise<Tournament[]> {
  const role = await getCallerRole()
  if (role !== 'coach' && role !== 'owner') return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, date, end_date, location, type, description, registration_deadline, coach_id, status, created_at')
    .order('date', { ascending: true })

  return (data ?? []) as Tournament[]
}
```

### Step 2.5 — Run tests to verify they pass

- [ ] Run: `npx vitest run app/actions/__tests__/tournaments.test.ts`
- Expected: all tests PASS

### Step 2.6 — Commit

```bash
git add app/actions/tournaments.ts app/actions/tournaments.schema.ts app/actions/__tests__/tournaments.test.ts
git commit -m "feat: tournament server actions (create, update, approve, cancel, list)"
```

---

## Task 3: Registration Server Actions

**Files:**
- Create: `app/actions/tournament-registrations.ts`
- Create: `app/actions/__tests__/tournament-registrations.test.ts`

### Step 3.1 — Write failing tests

- [ ] Create `app/actions/__tests__/tournament-registrations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import {
  registerForTournament,
  updateRegistrationStatus,
  getRegistrationsForTournament,
} from '../tournament-registrations'

function roleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('registerForTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'member-1' } }, error: null })
  })

  it('rejects when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await registerForTournament('t-1', {
      weight_category: '-70kg', gi_nogi: 'gi', notes: null,
    })
    expect(result.error).toBeTruthy()
  })

  it('upserts registration with pending status', async () => {
    const upsertChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(upsertChain)
    const result = await registerForTournament('t-1', {
      weight_category: '-70kg', gi_nogi: 'gi', notes: 'excited',
    })
    expect(result.success).toBe(true)
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      {
        tournament_id: 't-1',
        profile_id: 'member-1',
        weight_category: '-70kg',
        gi_nogi: 'gi',
        notes: 'excited',
        status: 'pending',
      },
      { onConflict: 'tournament_id,profile_id' },
    )
  })
})

describe('updateRegistrationStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('rejects non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await updateRegistrationStatus('r-1', 'approved')
    expect(result.error).toBeTruthy()
  })

  it('updates status for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await updateRegistrationStatus('r-1', 'approved')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'approved' })
  })
})

describe('getRegistrationsForTournament', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'coach-1' } }, error: null })
  })

  it('returns empty for non-staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('member'))
    const result = await getRegistrationsForTournament('t-1')
    expect(result).toEqual([])
  })

  it('returns registrations with member names for staff', async () => {
    mockSupabase.from.mockReturnValueOnce(roleChain('coach'))
    const listChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'r-1', profile_id: 'm-1', weight_category: '-70kg',
          gi_nogi: 'gi', notes: null, status: 'pending',
          profiles: { full_name: 'Max' },
        }],
        error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(listChain)
    const result = await getRegistrationsForTournament('t-1')
    expect(result).toHaveLength(1)
    expect(result[0].memberName).toBe('Max')
  })
})
```

### Step 3.2 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/tournament-registrations.test.ts`
- Expected: FAIL

### Step 3.3 — Implement `app/actions/tournament-registrations.ts`

- [ ] Create `app/actions/tournament-registrations.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RegistrationInput {
  weight_category: string | null
  gi_nogi: 'gi' | 'nogi' | 'both' | null
  notes: string | null
}

export interface Registration {
  id: string
  profileId: string
  memberName: string
  weight_category: string | null
  gi_nogi: 'gi' | 'nogi' | 'both' | null
  notes: string | null
  status: 'pending' | 'approved' | 'denied'
}

export async function registerForTournament(
  tournamentId: string,
  input: RegistrationInput,
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { error } = await supabase
    .from('tournament_registrations')
    .upsert(
      {
        tournament_id: tournamentId,
        profile_id: user.id,
        weight_category: input.weight_category,
        gi_nogi: input.gi_nogi,
        notes: input.notes,
        status: 'pending',
      },
      { onConflict: 'tournament_id,profile_id' },
    )

  if (error) return { error: 'Anmeldung fehlgeschlagen.' }

  revalidatePath('/dashboard/turniere')
  revalidatePath('/admin/turniere')
  return { success: true }
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: 'approved' | 'denied',
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') return { error: 'Keine Berechtigung.' }

  const { error } = await supabase
    .from('tournament_registrations')
    .update({ status })
    .eq('id', registrationId)

  if (error) return { error: 'Update fehlgeschlagen.' }

  revalidatePath('/admin/turniere')
  revalidatePath('/')
  return { success: true }
}

export async function getRegistrationsForTournament(
  tournamentId: string,
): Promise<Registration[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') return []

  const { data } = await supabase
    .from('tournament_registrations')
    .select('id, profile_id, weight_category, gi_nogi, notes, status, profiles(full_name)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    return {
      id: r.id,
      profileId: r.profile_id,
      memberName: p?.full_name ?? 'Unbekannt',
      weight_category: r.weight_category,
      gi_nogi: r.gi_nogi,
      notes: r.notes,
      status: r.status,
    }
  })
}

export async function getMyRegistrations(): Promise<{ tournamentId: string; status: 'pending' | 'approved' | 'denied' }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tournament_registrations')
    .select('tournament_id, status')
    .eq('profile_id', user.id)

  return (data ?? []).map(r => ({ tournamentId: r.tournament_id, status: r.status }))
}
```

### Step 3.4 — Run tests

- [ ] Run: `npx vitest run app/actions/__tests__/tournament-registrations.test.ts`
- Expected: all tests PASS

### Step 3.5 — Commit

```bash
git add app/actions/tournament-registrations.ts app/actions/__tests__/tournament-registrations.test.ts
git commit -m "feat: tournament registration server actions"
```

---

## Task 4: Public Server Action

**Files:**
- Create: `app/actions/public-tournaments.ts`

### Step 4.1 — Create action

- [ ] Create `app/actions/public-tournaments.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

export interface TournamentPublic {
  id: string
  name: string
  date: string
  endDate: string | null
  location: string
  type: 'internal' | 'external'
  description: string | null
  approvedParticipants: { name: string; avatarUrl: string | null }[]
}

export async function getPublicTournaments(): Promise<TournamentPublic[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id, name, date, end_date, location, type, description,
      tournament_registrations(
        status,
        profiles(full_name, avatar_url)
      )
    `)
    .eq('status', 'approved')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(4)

  if (error || !data) return []

  return data.map(t => {
    const regs = (t.tournament_registrations ?? []) as {
      status: string
      profiles: { full_name: string | null; avatar_url: string | null } | { full_name: string | null; avatar_url: string | null }[] | null
    }[]

    const approvedParticipants = regs
      .filter(r => r.status === 'approved')
      .map(r => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        return {
          name: (p?.full_name ?? 'Athlet').split(' ')[0],
          avatarUrl: p?.avatar_url ?? null,
        }
      })

    return {
      id: t.id,
      name: t.name,
      date: t.date,
      endDate: t.end_date,
      location: t.location,
      type: t.type as 'internal' | 'external',
      description: t.description,
      approvedParticipants,
    }
  })
}
```

### Step 4.2 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 4.3 — Commit

```bash
git add app/actions/public-tournaments.ts
git commit -m "feat: add getPublicTournaments action for landing page"
```

---

## Task 5: Admin Nav Updates

**Files:**
- Modify: `components/admin/AdminNav.tsx`
- Modify: `components/members/MemberNav.tsx`

### Step 5.1 — Update AdminNav

- [ ] Open `components/admin/AdminNav.tsx`. Add `Trophy` to the lucide-react import:

```ts
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users, Award,
  ClipboardList, Settings, LogOut, Building2, ScrollText,
  BookOpen, MonitorPlay, FileText, GraduationCap, MoreHorizontal, X, Trophy,
} from 'lucide-react'
```

- [ ] Update `opsItems` to add Turniere:

```ts
const opsItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',   label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',   label: 'Training',  Icon: CalendarDays },
  { href: '/admin/turniere',  label: 'Turniere',  Icon: Trophy },
]
```

- [ ] Update `coachBottomTabs` — replace "Schüler" (4th) with "Turniere":

```ts
const coachBottomTabs: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',   label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',   label: 'Training',  Icon: CalendarDays },
  { href: '/admin/turniere',  label: 'Turniere',  Icon: Trophy },
]
```

- [ ] Update `ownerMoreItems` to include Turniere at the top:

```ts
const ownerMoreItems: NavItem[] = [
  { href: '/admin/turniere', label: 'Turniere', Icon: Trophy },
  ...mitgliederItems.filter(i => i.href !== '/admin/mitglieder'),
  ...contentItems,
  ...systemItems,
]
```

### Step 5.2 — Update MemberNav

- [ ] Open `components/members/MemberNav.tsx`. Add `Trophy` to the lucide import if not already present.

- [ ] Update `navItems` function to include a Turniere entry (insert after `buchen` or `mein-training`):

```ts
function navItems(lang: Lang): NavItem[] {
  const t = translations[lang].nav
  return [
    { href: '/dashboard',     label: t.dashboard, Icon: LayoutDashboard },
    { href: '/buchen',        label: t.buchen,    Icon: Calendar },
    { href: '/mein-training', label: 'Training',  Icon: GraduationCap },
    { href: '/turniere',      label: 'Turniere',  Icon: Trophy },
    { href: '/bjj-rules',     label: 'BJJ Regeln', Icon: Scale },
    { href: '/leaderboard',   label: 'Leaderboard', Icon: Trophy },
    { href: '/gurtel',        label: t.gurtel,    Icon: Award },
    { href: '/skills',        label: t.skills,    Icon: BookOpen },
    { href: '/konto',         label: t.konto,     Icon: Settings },
  ]
}
```

**Note:** `Trophy` is used twice (Turniere and Leaderboard). Since lucide-react allows reuse of the same icon, this is fine.

**Path note:** The member page URL is `/dashboard/turniere` per the spec. The route in Next.js `(members)/dashboard/turniere` produces `/dashboard/turniere`. Update the href accordingly:

```ts
    { href: '/dashboard/turniere', label: 'Turniere', Icon: Trophy },
```

Replace the incorrect `/turniere` with `/dashboard/turniere` in both the navItems function and anywhere else it's referenced.

### Step 5.3 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 5.4 — Commit

```bash
git add components/admin/AdminNav.tsx components/members/MemberNav.tsx
git commit -m "feat: add Turniere nav links to admin and member sidebars"
```

---

## Task 6: Admin Tournament Page + Components

**Files:**
- Create: `components/admin/TournamentForm.tsx`
- Create: `components/admin/TournamentList.tsx`
- Create: `components/admin/RegistrationReviewPanel.tsx`
- Create: `app/(admin)/admin/turniere/page.tsx`

### Step 6.1 — Create `components/admin/TournamentForm.tsx`

- [ ] Create `components/admin/TournamentForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTournament, updateTournament, type Tournament } from '@/app/actions/tournaments'

interface Props {
  initial?: Tournament
  onClose: () => void
}

export function TournamentForm({ initial, onClose }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    date: initial?.date ?? '',
    end_date: initial?.end_date ?? '',
    location: initial?.location ?? '',
    type: (initial?.type ?? 'external') as 'internal' | 'external',
    description: initial?.description ?? '',
    registration_deadline: initial?.registration_deadline ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null)
    startTransition(async () => {
      const payload = {
        name: form.name,
        date: form.date,
        end_date: form.end_date || null,
        location: form.location,
        type: form.type,
        description: form.description || null,
        registration_deadline: form.registration_deadline || null,
      }
      const result = initial?.id
        ? await updateTournament(initial.id, payload)
        : await createTournament(payload)
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{initial ? 'Turnier bearbeiten' : 'Neues Turnier'}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
          <input className="w-full border border-border bg-background p-2 text-sm"
                 value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Datum</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End-Datum (optional)</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Ort</label>
          <input className="w-full border border-border bg-background p-2 text-sm"
                 value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Typ</label>
          <select className="w-full border border-border bg-background p-2 text-sm"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'internal' | 'external' })}>
            <option value="external">Extern</option>
            <option value="internal">Intern</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Beschreibung</label>
          <textarea rows={3} className="w-full border border-border bg-background p-2 text-sm"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Anmeldeschluss</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.registration_deadline}
                 onChange={e => setForm({ ...form, registration_deadline: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            Speichern
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </div>
    </div>
  )
}
```

### Step 6.2 — Create `components/admin/RegistrationReviewPanel.tsx`

- [ ] Create `components/admin/RegistrationReviewPanel.tsx`:

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getRegistrationsForTournament,
  updateRegistrationStatus,
  type Registration,
} from '@/app/actions/tournament-registrations'

interface Props {
  tournamentId: string
  tournamentName: string
  onClose: () => void
}

export function RegistrationReviewPanel({ tournamentId, tournamentName, onClose }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    getRegistrationsForTournament(tournamentId).then(data => {
      setRegistrations(data)
      setLoading(false)
    })
  }, [tournamentId])

  function review(id: string, status: 'approved' | 'denied') {
    startTransition(async () => {
      const result = await updateRegistrationStatus(id, status)
      if (!result.error) {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{tournamentName}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Anmeldungen
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Lädt…</p>
      ) : registrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Anmeldungen.</p>
      ) : (
        <ul className="space-y-3">
          {registrations.map(r => (
            <li key={r.id} className="border border-border bg-background p-3">
              <p className="text-sm font-bold">{r.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {r.weight_category ?? '—'} · {r.gi_nogi ?? '—'}
              </p>
              {r.notes && <p className="mt-1 text-xs text-muted-foreground italic">{r.notes}</p>}
              <div className="mt-2 flex gap-2 items-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 ${
                  r.status === 'approved' ? 'bg-primary/20 text-primary' :
                  r.status === 'denied' ? 'bg-destructive/20 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {r.status === 'approved' ? 'Bestätigt' : r.status === 'denied' ? 'Abgelehnt' : 'Ausstehend'}
                </span>
                {r.status !== 'approved' && (
                  <button disabled={isPending} onClick={() => review(r.id, 'approved')}
                          className="border border-primary px-2 py-1 text-[10px] text-primary">
                    ✓ Bestätigen
                  </button>
                )}
                {r.status !== 'denied' && (
                  <button disabled={isPending} onClick={() => review(r.id, 'denied')}
                          className="border border-destructive px-2 py-1 text-[10px] text-destructive">
                    ✗ Ablehnen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Step 6.3 — Create `components/admin/TournamentList.tsx`

- [ ] Create `components/admin/TournamentList.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveTournament, cancelTournament, type Tournament } from '@/app/actions/tournaments'
import { TournamentForm } from './TournamentForm'
import { RegistrationReviewPanel } from './RegistrationReviewPanel'

interface Props {
  tournaments: Tournament[]
  role: 'coach' | 'owner'
}

export function TournamentList({ tournaments, role }: Props) {
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [creating, setCreating] = useState(false)
  const [reviewing, setReviewing] = useState<Tournament | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function approve(id: string) {
    startTransition(async () => {
      await approveTournament(id)
      router.refresh()
    })
  }

  function cancel(id: string) {
    if (!confirm('Turnier absagen?')) return
    startTransition(async () => {
      await cancelTournament(id)
      router.refresh()
    })
  }

  function statusLabel(s: Tournament['status']) {
    if (s === 'approved') return { text: 'Genehmigt', cls: 'bg-primary/20 text-primary' }
    if (s === 'cancelled') return { text: 'Abgesagt', cls: 'bg-muted text-muted-foreground' }
    return { text: 'Ausstehend', cls: 'bg-yellow-200 text-yellow-900' }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">Turniere</h1>
        <button onClick={() => setCreating(true)}
                className="bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
          + Neues Turnier
        </button>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Turniere.</p>
      ) : (
        <ul className="space-y-3">
          {tournaments.map(t => {
            const s = statusLabel(t.status)
            return (
              <li key={t.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black">{t.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${s.cls}`}>{s.text}</span>
                      <span className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                        {t.type === 'internal' ? 'Intern' : 'Extern'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {t.date}{t.end_date ? ` – ${t.end_date}` : ''} · {t.location}
                    </p>
                    {t.description && <p className="mt-2 text-xs text-muted-foreground">{t.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {t.status === 'pending_approval' && role === 'owner' && (
                      <button disabled={isPending} onClick={() => approve(t.id)}
                              className="border border-primary px-2 py-1 text-[10px] text-primary">
                        ✓ Genehmigen
                      </button>
                    )}
                    {t.status === 'approved' && (
                      <button onClick={() => setReviewing(t)}
                              className="border border-border px-2 py-1 text-[10px]">
                        Anmeldungen
                      </button>
                    )}
                    {t.status !== 'cancelled' && (
                      <button onClick={() => setEditing(t)}
                              className="border border-border px-2 py-1 text-[10px]">
                        Edit
                      </button>
                    )}
                    {t.status !== 'cancelled' && (
                      <button disabled={isPending} onClick={() => cancel(t.id)}
                              className="border border-destructive px-2 py-1 text-[10px] text-destructive">
                        Absagen
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <TournamentForm onClose={() => setCreating(false)} />}
      {editing && <TournamentForm initial={editing} onClose={() => setEditing(null)} />}
      {reviewing && <RegistrationReviewPanel
        tournamentId={reviewing.id}
        tournamentName={reviewing.name}
        onClose={() => setReviewing(null)}
      />}
    </div>
  )
}
```

### Step 6.4 — Create `app/(admin)/admin/turniere/page.tsx`

- [ ] Create `app/(admin)/admin/turniere/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTournamentsForAdmin } from '@/app/actions/tournaments'
import { TournamentList } from '@/components/admin/TournamentList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Turniere | Admin' }

export default async function AdminTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  if (role !== 'coach' && role !== 'owner') redirect('/dashboard')

  const tournaments = await getTournamentsForAdmin()

  return <TournamentList tournaments={tournaments} role={role as 'coach' | 'owner'} />
}
```

### Step 6.5 — TypeScript check and test run

- [ ] Run: `npx tsc --noEmit` — expected: no new errors
- [ ] Run: `npx vitest run` — expected: baseline pass/fail

### Step 6.6 — Commit

```bash
git add components/admin/TournamentForm.tsx components/admin/TournamentList.tsx components/admin/RegistrationReviewPanel.tsx "app/(admin)/admin/turniere/page.tsx"
git commit -m "feat: admin tournament page with create/edit/approve/registration review"
```

---

## Task 7: Member Tournament Page

**Files:**
- Create: `components/members/MemberTournamentList.tsx`
- Create: `app/(members)/dashboard/turniere/page.tsx`

### Step 7.1 — Create `components/members/MemberTournamentList.tsx`

- [ ] Create `components/members/MemberTournamentList.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerForTournament } from '@/app/actions/tournament-registrations'
import type { Tournament } from '@/app/actions/tournaments'

interface MyReg {
  tournamentId: string
  status: 'pending' | 'approved' | 'denied'
}

interface Props {
  tournaments: Tournament[]
  myRegistrations: MyReg[]
}

export function MemberTournamentList({ tournaments, myRegistrations }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ weight_category: '', gi_nogi: 'gi' as 'gi' | 'nogi' | 'both', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function myStatus(tournamentId: string) {
    return myRegistrations.find(r => r.tournamentId === tournamentId)?.status ?? null
  }

  function submit(tournamentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await registerForTournament(tournamentId, {
        weight_category: form.weight_category || null,
        gi_nogi: form.gi_nogi,
        notes: form.notes || null,
      })
      if (result.error) { setError(result.error); return }
      setExpandedId(null)
      setForm({ weight_category: '', gi_nogi: 'gi', notes: '' })
      router.refresh()
    })
  }

  function statusBadge(status: 'pending' | 'approved' | 'denied' | null) {
    if (status === 'approved') return <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary">Bestätigt ✓</span>
    if (status === 'denied') return <span className="text-[10px] font-bold px-2 py-0.5 bg-destructive/20 text-destructive">Abgelehnt</span>
    if (status === 'pending') return <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-200 text-yellow-900">Ausstehend</span>
    return null
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black">Turniere</h1>
      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine anstehenden Turniere.</p>
      ) : (
        <ul className="space-y-3">
          {tournaments.map(t => {
            const status = myStatus(t.id)
            const canRegister = status === null || status === 'denied'
            const deadlinePassed = t.registration_deadline
              ? new Date(t.registration_deadline) < new Date()
              : false
            return (
              <li key={t.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black">{t.name}</p>
                      <span className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                        {t.type === 'internal' ? 'Intern' : 'Extern'}
                      </span>
                      {statusBadge(status)}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {t.date}{t.end_date ? ` – ${t.end_date}` : ''} · {t.location}
                    </p>
                    {t.description && <p className="mt-2 text-xs text-muted-foreground">{t.description}</p>}
                    {t.registration_deadline && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Anmeldeschluss: {t.registration_deadline}
                      </p>
                    )}
                  </div>
                  {canRegister && !deadlinePassed && (
                    <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                            className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                      {expandedId === t.id ? 'Abbrechen' : 'Anmelden'}
                    </button>
                  )}
                </div>

                {expandedId === t.id && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Gewichtsklasse</label>
                      <input className="w-full border border-border bg-background p-2 text-sm"
                             placeholder="-70kg"
                             value={form.weight_category}
                             onChange={e => setForm({ ...form, weight_category: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Gi / No-Gi</label>
                      <div className="flex gap-3 text-sm">
                        {(['gi', 'nogi', 'both'] as const).map(v => (
                          <label key={v} className="flex items-center gap-1">
                            <input type="radio" name={`gi-${t.id}`} checked={form.gi_nogi === v}
                                   onChange={() => setForm({ ...form, gi_nogi: v })} />
                            {v === 'gi' ? 'Gi' : v === 'nogi' ? 'No-Gi' : 'Beides'}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Notizen</label>
                      <textarea rows={2} className="w-full border border-border bg-background p-2 text-sm"
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <button onClick={() => submit(t.id)} disabled={isPending}
                            className="bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
                      {isPending ? 'Sende…' : 'Anmeldung senden'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
```

### Step 7.2 — Create `app/(members)/dashboard/turniere/page.tsx`

- [ ] Create `app/(members)/dashboard/turniere/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberTournamentList } from '@/components/members/MemberTournamentList'
import { getMyRegistrations } from '@/app/actions/tournament-registrations'
import type { Tournament } from '@/app/actions/tournaments'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Turniere' }

export default async function MemberTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, date, end_date, location, type, description, registration_deadline, coach_id, status, created_at')
    .eq('status', 'approved')
    .gte('date', today)
    .order('date', { ascending: true })

  const tournaments = (data ?? []) as Tournament[]
  const myRegistrations = await getMyRegistrations()

  return <MemberTournamentList tournaments={tournaments} myRegistrations={myRegistrations} />
}
```

### Step 7.3 — TypeScript check and commit

- [ ] Run: `npx tsc --noEmit` — no new errors
- [ ] Commit:
```bash
git add components/members/MemberTournamentList.tsx "app/(members)/dashboard/turniere/page.tsx"
git commit -m "feat: member tournament page with registration form"
```

---

## Task 8: Landing Page Tournament Section

**Files:**
- Create: `components/public/TournamentCard.tsx`
- Create: `components/public/TournamentSection.tsx`
- Modify: `app/(public)/page.tsx`

### Step 8.1 — Create `components/public/TournamentCard.tsx`

- [ ] Create `components/public/TournamentCard.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'
import type { TournamentPublic } from '@/app/actions/public-tournaments'

interface Props {
  tournament: TournamentPublic
  index: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TournamentCard({ tournament, index }: Props) {
  const { name, date, endDate, location, type, description, approvedParticipants } = tournament

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-border bg-background rounded-xl p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-xl font-black text-foreground">{name}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
          type === 'internal' ? 'bg-primary/20 text-primary' : 'bg-foreground/10 text-foreground'
        }`}>
          {type === 'internal' ? 'Intern' : 'Extern'}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1 font-mono">
          <Calendar size={12} />
          {formatDate(date)}{endDate ? ` – ${formatDate(endDate)}` : ''}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {location}
        </span>
      </div>

      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}

      {approvedParticipants.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {approvedParticipants.length} Teilnehmer bestätigt
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {approvedParticipants.map((p, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 w-16">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border border-border mb-1 relative">
                  {p.avatarUrl ? (
                    <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {p.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-center truncate w-full">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  )
}
```

### Step 8.2 — Create `components/public/TournamentSection.tsx`

- [ ] Create `components/public/TournamentSection.tsx`:

```tsx
import { getPublicTournaments } from '@/app/actions/public-tournaments'
import { TournamentCard } from './TournamentCard'

export async function TournamentSection() {
  const tournaments = await getPublicTournaments()

  if (tournaments.length === 0) return null

  return (
    <section id="turniere" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Turniere · Upcoming
        </p>
        <h2 className="mb-10 text-3xl sm:text-4xl font-black text-foreground">
          Nächste Events
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Step 8.3 — Add TournamentSection to homepage

- [ ] Open `app/(public)/page.tsx`. Add the import:

```tsx
import { TournamentSection } from '@/components/public/TournamentSection'
```

- [ ] Add `<TournamentSection />` in the JSX after `<CoachSection />`:

```tsx
    <>
      <TrialCTA />
      <StatsBar />
      <CoachSection />
      <TournamentSection />
      <ProgramsGrid />
      <LandingPricing plans={pricingPlans} />
      <ScheduleWidget schedule={schedule} />
      <Hero slides={slides} />
    </>
```

### Step 8.4 — TypeScript check and test run

- [ ] Run: `npx tsc --noEmit` — no new errors
- [ ] Run: `npx vitest run` — baseline pass/fail

### Step 8.5 — Commit and push

```bash
git add components/public/TournamentCard.tsx components/public/TournamentSection.tsx "app/(public)/page.tsx"
git commit -m "feat: landing page Tournament section with upcoming events and participant slider"
git push origin main
```
