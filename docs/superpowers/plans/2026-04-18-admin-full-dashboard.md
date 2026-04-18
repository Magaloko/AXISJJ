# Admin Full Dashboard (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Phase 2a admin section into a complete command center — enhanced dashboard with action widgets (PromotionsWidget, LeadsMiniKanban) plus four new/enhanced admin pages: /admin/guertel, /admin/leads, /admin/mitglieder (edit), /admin/einstellungen.

**Architecture:** Server-rendered pages fetching via Supabase; mutations via server actions (`'use server'`) with role guards; client components use `useTransition` for optimistic inline updates; `revalidatePath` refreshes data after every mutation. All new server actions live in `app/actions/*.ts`, all new UI in `components/admin/*.tsx`.

**Tech Stack:** Next.js 15 App Router · Supabase SSR · Tailwind (existing semantic tokens) · Vitest + jsdom · TypeScript. Existing Phase 2a code in the worktree is the source of truth for patterns.

**Spec reference:** `docs/superpowers/specs/2026-04-18-admin-full-dashboard-design.md`

---

## File Structure

**New server-action files:**
- `app/actions/promotions.ts` — `promoteToNextBelt`
- `app/actions/members.ts` — `updateMember`, `updateMemberRole`
- `app/actions/class-types.ts` — `upsertClassType`, `deleteClassType`

**Extended server actions:**
- `app/actions/leads.ts` — ADD `updateLeadStatus`, `createLead` (file already exists for Phase 1 contact form)
- `app/actions/admin.ts` — extend `getAdminDashboard` return shape with `promotionsReady` (with real `nextBelt`) and `leadsByStatus`

**New components:**
- `components/admin/PromotionsWidget.tsx` — dashboard widget
- `components/admin/LeadsMiniKanban.tsx` — dashboard widget
- `components/admin/BeltEligibilityList.tsx` — /admin/guertel left column
- `components/admin/PromotionHistory.tsx` — /admin/guertel right column
- `components/admin/LeadsKanban.tsx` — /admin/leads kanban view
- `components/admin/LeadsListView.tsx` — /admin/leads list view
- `components/admin/LeadForm.tsx` — slide-over create-lead form
- `components/admin/MemberEditPanel.tsx` — /admin/mitglieder slide-in panel
- `components/admin/ClassTypeTable.tsx` + `ClassTypeForm.tsx` — /admin/einstellungen left column
- `components/admin/RoleManager.tsx` — /admin/einstellungen right column

**New pages:**
- `app/(admin)/admin/guertel/page.tsx`
- `app/(admin)/admin/leads/page.tsx`
- `app/(admin)/admin/einstellungen/page.tsx`

**Modified pages:**
- `app/(admin)/admin/dashboard/page.tsx` — render new widgets for owners
- `app/(admin)/admin/mitglieder/page.tsx` — wire `MemberEditPanel` in place of the existing read-only modal

**Modified files:**
- `components/admin/AdminNav.tsx` — drop `phase2b` flag gating
- `components/admin/MemberTable.tsx` — row click opens `MemberEditPanel` for owner
- `lib/i18n/de.ts` + `lib/i18n/en.ts` — add new admin sub-keys

---

## Task 1: i18n additions

**Files:**
- Modify: `lib/i18n/de.ts`
- Modify: `lib/i18n/en.ts`

- [ ] **Step 1: Append new keys to the `admin` object in `lib/i18n/de.ts`**

Locate the existing `admin: { ... }` block (Phase 2a keys: `nav`, `dashboard`, `checkin`, `klassen`, `mitglieder`). Inside the `mitglieder` block, add new keys. Add three new top-level blocks: `guertel`, `leads`, `einstellungen`.

Merge this into the existing `admin` object (do NOT replace it):

```typescript
mitglieder: {
  // …existing keys stay unchanged
  edit: 'Bearbeiten',
  save: 'Speichern',
  cancel: 'Abbrechen',
  role: 'Rolle',
  phone: 'Telefon',
  birthDate: 'Geburtsdatum',
  beltHistory: 'Gürtel-History',
},
guertel: {
  title: 'Gürtelpromotions',
  eligible: 'Bereit zu promoten',
  history: 'Promotions-History',
  promoteBtn: 'Promoten',
  promoteNow: 'Jetzt',
  confirmPromote: '{name} zu {belt} befördern?',
  noneReady: 'Keine Promotions bereit',
  sessionsLabel: 'Sessions',
  monthsLabel: 'Monate',
},
leads: {
  title: 'Leads',
  kanban: 'Kanban',
  list: 'Liste',
  newLead: 'Neuer Lead',
  statusNew: 'Neu',
  statusContacted: 'Kontaktiert',
  statusConverted: 'Konvertiert',
  statusLost: 'Verloren',
  moveToContacted: 'Kontaktiert →',
  moveToConverted: 'Konvertiert →',
  moveToLost: 'Verloren',
  reopen: 'Wiederaufnehmen',
  sourceWebsite: 'Website',
  sourceInstagram: 'Instagram',
  namePlaceholder: 'Name',
  emailPlaceholder: 'E-Mail',
  phonePlaceholder: 'Telefon (optional)',
  messagePlaceholder: 'Nachricht (optional)',
  sourceLabel: 'Quelle',
},
einstellungen: {
  title: 'Einstellungen',
  classTypes: 'Klassentypen',
  newType: 'Neuer Klassentyp',
  editType: 'Klassentyp bearbeiten',
  deleteConfirm: 'Klassentyp löschen?',
  deleteBlocked: 'Noch aktive Sessions — zuerst Sessions absagen.',
  roles: 'Rollen & Zugänge',
  coaches: 'Coaches',
  promoteToCoach: '→ Coach',
  demoteToMember: '→ Mitglied',
  searchMember: 'Name suchen ...',
  levelBeginner: 'Anfänger',
  levelAll: 'Alle',
  levelAdvanced: 'Fortgeschritten',
  levelKids: 'Kids',
  gi: 'Gi',
  noGi: 'No-Gi',
},
```

- [ ] **Step 2: Mirror the same keys in `lib/i18n/en.ts` with English translations**

```typescript
mitglieder: {
  // …existing keys stay unchanged
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  role: 'Role',
  phone: 'Phone',
  birthDate: 'Date of Birth',
  beltHistory: 'Belt history',
},
guertel: {
  title: 'Belt Promotions',
  eligible: 'Ready to promote',
  history: 'Promotion history',
  promoteBtn: 'Promote',
  promoteNow: 'Now',
  confirmPromote: 'Promote {name} to {belt}?',
  noneReady: 'No promotions ready',
  sessionsLabel: 'Sessions',
  monthsLabel: 'Months',
},
leads: {
  title: 'Leads',
  kanban: 'Kanban',
  list: 'List',
  newLead: 'New Lead',
  statusNew: 'New',
  statusContacted: 'Contacted',
  statusConverted: 'Converted',
  statusLost: 'Lost',
  moveToContacted: 'Contacted →',
  moveToConverted: 'Converted →',
  moveToLost: 'Lost',
  reopen: 'Reopen',
  sourceWebsite: 'Website',
  sourceInstagram: 'Instagram',
  namePlaceholder: 'Name',
  emailPlaceholder: 'Email',
  phonePlaceholder: 'Phone (optional)',
  messagePlaceholder: 'Message (optional)',
  sourceLabel: 'Source',
},
einstellungen: {
  title: 'Settings',
  classTypes: 'Class Types',
  newType: 'New Class Type',
  editType: 'Edit Class Type',
  deleteConfirm: 'Delete class type?',
  deleteBlocked: 'Active sessions exist — cancel sessions first.',
  roles: 'Roles & Access',
  coaches: 'Coaches',
  promoteToCoach: '→ Coach',
  demoteToMember: '→ Member',
  searchMember: 'Search by name ...',
  levelBeginner: 'Beginner',
  levelAll: 'All Levels',
  levelAdvanced: 'Advanced',
  levelKids: 'Kids',
  gi: 'Gi',
  noGi: 'No-Gi',
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/de.ts lib/i18n/en.ts
git commit -m "feat(i18n): add admin Phase 2b keys (guertel, leads, einstellungen, mitglieder-edit)"
```

---

## Task 2: promoteToNextBelt server action

**Files:**
- Create: `app/actions/promotions.ts`
- Create: `app/actions/__tests__/promotions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/actions/__tests__/promotions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { promoteToNextBelt } from '../promotions'

function callerRoleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('promoteToNextBelt', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'owner-1' } }, error: null,
    })
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when caller is not owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('coach'))
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when member has no current rank', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    // current rank lookup: no rows
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('returns error when no next belt exists', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { belt_rank_id: 'rank-top', belt_ranks: { order: 10 } }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const nextBeltChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(nextBeltChain)
    const result = await promoteToNextBelt('profile-1')
    expect(result.error).toBeTruthy()
  })

  it('inserts new profile_rank and returns success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const rankChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { belt_rank_id: 'rank-white', belt_ranks: { order: 0 } }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(rankChain)
    const nextBeltChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'rank-blue', name: 'Blau' }, error: null,
      }),
    }
    mockSupabase.from.mockReturnValueOnce(nextBeltChain)
    const insertChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(insertChain)

    const result = await promoteToNextBelt('profile-1')
    expect(result.success).toBe(true)
    expect(result.newBeltName).toBe('Blau')
    expect(insertChain.insert).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run app/actions/__tests__/promotions.test.ts`
Expected: FAIL — `promoteToNextBelt is not a function`.

- [ ] **Step 3: Implement `app/actions/promotions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function promoteToNextBelt(profileId: string): Promise<{
  success?: true
  newBeltName?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller, error: callerError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (callerError || caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }

  // Find current rank (most recent profile_ranks row, include belt order)
  const { data: currentRank } = await supabase
    .from('profile_ranks')
    .select('belt_rank_id, belt_ranks(order)')
    .eq('profile_id', profileId)
    .order('promoted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!currentRank) return { error: 'Kein aktueller Gürtel gefunden.' }

  const currentBelt = Array.isArray(currentRank.belt_ranks)
    ? currentRank.belt_ranks[0]
    : currentRank.belt_ranks
  const currentOrder = (currentBelt as { order: number } | null)?.order
  if (currentOrder === undefined || currentOrder === null) {
    return { error: 'Gürtel-Reihenfolge ungültig.' }
  }

  // Find next belt (lowest order > current)
  const { data: nextBelt } = await supabase
    .from('belt_ranks')
    .select('id, name')
    .gt('order', currentOrder)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextBelt) return { error: 'Kein höherer Gürtel verfügbar.' }

  const { error: insertError } = await (supabase.from('profile_ranks') as any).insert({
    profile_id: profileId,
    belt_rank_id: (nextBelt as { id: string }).id,
    promoted_at: new Date().toISOString().slice(0, 10),
    promoted_by: user.id,
  })
  if (insertError) return { error: 'Promotion fehlgeschlagen.' }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/guertel')
  revalidatePath('/admin/mitglieder')

  return { success: true, newBeltName: (nextBelt as { name: string }).name }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run app/actions/__tests__/promotions.test.ts`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add app/actions/promotions.ts app/actions/__tests__/promotions.test.ts
git commit -m "feat(admin): add promoteToNextBelt server action with owner-only guard"
```

---

## Task 3: Leads server actions (updateLeadStatus, createLead)

**Files:**
- Modify: `app/actions/leads.ts`
- Modify/Create: `app/actions/__tests__/leads.test.ts`

- [ ] **Step 1: Inspect existing `leads.ts`**

Read `app/actions/leads.ts` to see the Phase 1 contact form action. Keep it. You're adding two new exports.

- [ ] **Step 2: Write failing tests (append to existing test file or create if absent)**

Create or extend `app/actions/__tests__/leads.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateLeadStatus, createLead } from '../leads'

function callerRoleChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('updateLeadStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('rejects unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await updateLeadStatus('l-1', 'contacted')).error).toBeTruthy()
  })

  it('rejects member role', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('member'))
    expect((await updateLeadStatus('l-1', 'contacted')).error).toBeTruthy()
  })

  it('rejects invalid status', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    expect((await updateLeadStatus('l-1', 'bogus' as any)).error).toBeTruthy()
  })

  it('updates status on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('owner'))
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(updateChain)
    const result = await updateLeadStatus('l-1', 'converted')
    expect(result.success).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'converted' })
  })
})

describe('createLead', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'coach-1' } }, error: null,
    })
  })

  it('requires auth', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await createLead({ full_name: 'X', email: 'x@x.com', source: 'website' })).error).toBeTruthy()
  })

  it('requires coach/owner role', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('member'))
    expect((await createLead({ full_name: 'X', email: 'x@x.com', source: 'website' })).error).toBeTruthy()
  })

  it('inserts the lead', async () => {
    mockSupabase.from.mockReturnValueOnce(callerRoleChain('coach'))
    const insertChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(insertChain)
    const result = await createLead({ full_name: 'Max', email: 'max@x.com', source: 'instagram' })
    expect(result.success).toBe(true)
    expect(insertChain.insert).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests, verify failures**

Run: `npx vitest run app/actions/__tests__/leads.test.ts`
Expected: FAIL (functions undefined).

- [ ] **Step 4: Add implementations at the bottom of `app/actions/leads.ts`**

```typescript
// Append to the existing file — do not remove prior exports

const VALID_LEAD_STATUS = ['new', 'contacted', 'converted', 'lost'] as const
type LeadStatus = typeof VALID_LEAD_STATUS[number]

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<{ success?: true; error?: string }> {
  if (!VALID_LEAD_STATUS.includes(status)) return { error: 'Ungültiger Status.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !['coach', 'owner'].includes(caller.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  const { error } = await (supabase.from('leads') as any)
    .update({ status })
    .eq('id', leadId)
  if (error) return { error: 'Status-Update fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export interface NewLeadData {
  full_name: string
  email: string
  phone?: string
  message?: string
  source: 'website' | 'instagram'
}

export async function createLead(data: NewLeadData): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !['coach', 'owner'].includes(caller.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  if (!data.full_name?.trim() || !data.email?.trim()) {
    return { error: 'Name und E-Mail sind Pflicht.' }
  }

  const { error } = await (supabase.from('leads') as any).insert({
    full_name: data.full_name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || null,
    message: data.message?.trim() || null,
    source: data.source,
    status: 'new',
  })
  if (error) return { error: 'Lead-Erstellung fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
```

Add `import { revalidatePath } from 'next/cache'` and `import { createClient } from '@/lib/supabase/server'` at the top of the file if not already present.

- [ ] **Step 5: Run tests, verify pass**

Run: `npx vitest run app/actions/__tests__/leads.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/actions/leads.ts app/actions/__tests__/leads.test.ts
git commit -m "feat(admin): add updateLeadStatus and createLead server actions"
```

---

## Task 4: Member server actions (updateMember, updateMemberRole)

**Files:**
- Create: `app/actions/members.ts`
- Create: `app/actions/__tests__/members.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/actions/__tests__/members.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { updateMember, updateMemberRole } from '../members'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('updateMember', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateMember('p-1', { full_name: 'X' })).error).toBeTruthy()
  })

  it('updates fields', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateMember('p-1', { full_name: 'Thomas B.', phone: '+43 660', date_of_birth: '1990-01-01' })
    expect(res.success).toBe(true)
    expect(upd.update).toHaveBeenCalledWith({
      full_name: 'Thomas B.', phone: '+43 660', date_of_birth: '1990-01-01',
    })
  })
})

describe('updateMemberRole', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateMemberRole('p-1', 'coach')).error).toBeTruthy()
  })

  it('rejects self role change', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    expect((await updateMemberRole('owner-1', 'member')).error).toBeTruthy()
  })

  it('rejects role=owner from UI', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    expect((await updateMemberRole('p-1', 'owner' as any)).error).toBeTruthy()
  })

  it('updates role on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateMemberRole('p-1', 'coach')
    expect(res.success).toBe(true)
    expect(upd.update).toHaveBeenCalledWith({ role: 'coach' })
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run app/actions/__tests__/members.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `app/actions/members.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertOwner(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return { userId: user.id }
}

export interface MemberUpdate {
  full_name?: string
  phone?: string | null
  date_of_birth?: string | null
}

export async function updateMember(
  profileId: string,
  data: MemberUpdate,
): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {}
  if (data.full_name !== undefined) payload.full_name = data.full_name.trim()
  if (data.phone !== undefined) payload.phone = data.phone?.trim() || null
  if (data.date_of_birth !== undefined) payload.date_of_birth = data.date_of_birth || null

  if (!Object.keys(payload).length) return { error: 'Keine Änderungen.' }

  const { error } = await (supabase.from('profiles') as any)
    .update(payload)
    .eq('id', profileId)
  if (error) return { error: 'Update fehlgeschlagen.' }

  revalidatePath('/admin/mitglieder')
  return { success: true }
}

export async function updateMemberRole(
  profileId: string,
  role: 'member' | 'coach',
): Promise<{ success?: true; error?: string }> {
  if (role !== 'member' && role !== 'coach') return { error: 'Ungültige Rolle.' }

  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  if (check.userId === profileId) return { error: 'Eigene Rolle kann nicht geändert werden.' }

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', profileId)
  if (error) return { error: 'Rollen-Update fehlgeschlagen.' }

  revalidatePath('/admin/mitglieder')
  revalidatePath('/admin/einstellungen')
  return { success: true }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run app/actions/__tests__/members.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/members.ts app/actions/__tests__/members.test.ts
git commit -m "feat(admin): add updateMember and updateMemberRole server actions"
```

---

## Task 5: Class type server actions (upsertClassType, deleteClassType)

**Files:**
- Create: `app/actions/class-types.ts`
- Create: `app/actions/__tests__/class-types.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { upsertClassType, deleteClassType } from '../class-types'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

describe('upsertClassType', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await upsertClassType({ name: 'X', level: 'all', gi: true })).error).toBeTruthy()
  })

  it('upserts on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upsert = { upsert: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upsert)
    const res = await upsertClassType({ id: 'c-1', name: 'BJJ', level: 'all', gi: true, description: 'desc' })
    expect(res.success).toBe(true)
    expect(upsert.upsert).toHaveBeenCalled()
  })
})

describe('deleteClassType', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await deleteClassType('c-1')).error).toBeTruthy()
  })

  it('rejects deletion when sessions exist', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(countChain)
    expect((await deleteClassType('c-1')).error).toBeTruthy()
  })

  it('deletes when no sessions exist', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(countChain)
    const delChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    mockSupabase.from.mockReturnValueOnce(delChain)
    const res = await deleteClassType('c-1')
    expect(res.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run app/actions/__tests__/class-types.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `app/actions/class-types.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertOwner(): Promise<true | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return true
}

export interface ClassTypeData {
  id?: string
  name: string
  description?: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

export async function upsertClassType(data: ClassTypeData): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  if (!data.name?.trim()) return { error: 'Name ist Pflicht.' }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    level: data.level,
    gi: data.gi,
  }
  if (data.id) payload.id = data.id

  const { error } = await (supabase.from('class_types') as any).upsert(payload)
  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')
  return { success: true }
}

export async function deleteClassType(id: string): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const supabase = await createClient()
  const { count, error: countError } = await supabase
    .from('class_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('class_type_id', id)
  if (countError) return { error: 'Prüfung fehlgeschlagen.' }
  if ((count ?? 0) > 0) return { error: 'Noch aktive Sessions — zuerst Sessions absagen.' }

  const { error } = await (supabase.from('class_types') as any).delete().eq('id', id)
  if (error) return { error: 'Löschen fehlgeschlagen.' }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/klassen')
  return { success: true }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run app/actions/__tests__/class-types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/class-types.ts app/actions/__tests__/class-types.test.ts
git commit -m "feat(admin): add upsertClassType and deleteClassType server actions"
```

---

## Task 6: Extend getAdminDashboard (proper next belt + leadsByStatus)

**Files:**
- Modify: `app/actions/admin.ts`
- Modify: `app/actions/__tests__/admin.test.ts`

- [ ] **Step 1: Add failing tests for new return shape**

Append to `app/actions/__tests__/admin.test.ts` a new describe block:

```typescript
describe('getAdminDashboard — owner leadsByStatus and promotionsReady next-belt', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns leadsByStatus buckets with counts and top items', async () => {
    // Caller profile = owner
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    })
    // checkinsResult, bookingsResult, sessionsResult — all resolve with empty/zero
    function countChain(value: number) {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: value, data: [], error: null }),
      }
    }
    mockSupabase.from.mockReturnValueOnce(countChain(0))
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
    })
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    // members count
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
    })
    // new leads count
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
    })
    // promotions (profile_ranks query)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    // belt_ranks for computing next belt lookup
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'w', name: 'Weiß', order: 0 }, { id: 'b', name: 'Blau', order: 1 }], error: null }),
    })
    // leadsByStatus query
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 'l1', full_name: 'Max', source: 'instagram', status: 'new', created_at: '2026-04-18T00:00:00Z' },
          { id: 'l2', full_name: 'Sara', source: 'website', status: 'new', created_at: '2026-04-17T00:00:00Z' },
          { id: 'l3', full_name: 'Tim', source: 'instagram', status: 'contacted', created_at: '2026-04-16T00:00:00Z' },
          { id: 'l4', full_name: 'Anna', source: 'website', status: 'converted', created_at: '2026-04-15T00:00:00Z' },
        ],
        error: null,
      }),
    })

    const { getAdminDashboard } = await import('../admin')
    const result = await getAdminDashboard()

    expect(result.leadsByStatus).toBeDefined()
    expect(result.leadsByStatus?.new.length).toBe(2)
    expect(result.leadsByStatus?.contacted.length).toBe(1)
    expect(result.leadsByStatus?.converted.length).toBe(1)
    expect(result.leadsByStatus?.lost.length).toBe(0)
    expect(result.leadsByStatus?.totals.new).toBe(2)
  })
})
```

Note: this test focuses on leadsByStatus presence. The existing promotions test already covers the happy path structurally.

- [ ] **Step 2: Run tests, verify the new test fails**

Run: `npx vitest run app/actions/__tests__/admin.test.ts`
Expected: new test fails (`leadsByStatus` undefined).

- [ ] **Step 3: Extend `getAdminDashboard` return shape and implementation**

In `app/actions/admin.ts`:

a) Update the return type signature:

```typescript
export interface PromotionReady {
  profileId: string
  memberName: string
  currentBelt: string
  currentBeltColor: string | null
  nextBelt: string
  nextBeltColor: string | null
  sessions: number
  months: number
}

export interface LeadCard {
  id: string
  full_name: string
  source: 'website' | 'instagram'
  status: 'new' | 'contacted' | 'converted' | 'lost'
  created_at: string
}

export interface LeadsByStatus {
  new: LeadCard[]
  contacted: LeadCard[]
  converted: LeadCard[]
  lost: LeadCard[]
  totals: { new: number; contacted: number; converted: number; lost: number }
}

// Update getAdminDashboard return type:
export async function getAdminDashboard(): Promise<{
  role: 'coach' | 'owner'
  checkinsToday: number
  bookingsToday: number
  todaySessions: TodaySession[]
  activeMembers?: number
  newLeads?: number
  promotionsReady?: PromotionReady[]
  leadsByStatus?: LeadsByStatus
  error?: string
}>
```

b) After the owner guard block, replace the existing promotionsReady logic with:

```typescript
// Fetch all belt_ranks ordered by order ASC (needed for "next belt" lookup + colors)
const { data: allBelts } = await supabase
  .from('belt_ranks')
  .select('id, name, order, color_hex, min_sessions, min_time_months')
  .order('order', { ascending: true })

type BeltRow = { id: string; name: string; order: number; color_hex: string | null; min_sessions: number | null; min_time_months: number | null }
const beltList = (allBelts ?? []) as BeltRow[]
const beltById = new Map(beltList.map(b => [b.id, b]))
const beltByOrder = new Map(beltList.map(b => [b.order, b]))

const now = new Date()
const promotionsReady: PromotionReady[] = []

// Group profile_ranks by profile, pick the most recent row per profile
const latestRankByProfile = new Map<string, { belt_rank_id: string; promoted_at: string; full_name: string }>()
for (const row of promotionsResult.data ?? []) {
  const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  if (!rawProfile) continue
  const profile = rawProfile as { full_name: string }
  const key = row.profile_id as string
  if (!latestRankByProfile.has(key)) {
    latestRankByProfile.set(key, {
      belt_rank_id: row.belt_rank_id as string,
      promoted_at: row.promoted_at as string,
      full_name: profile.full_name ?? 'Unbekannt',
    })
  }
}

// For each profile, check eligibility for the next belt
for (const [profileId, latest] of latestRankByProfile) {
  const currentBelt = beltById.get(latest.belt_rank_id)
  if (!currentBelt) continue
  const nextBelt = beltByOrder.get(currentBelt.order + 1)
  if (!nextBelt) continue

  // Fetch session count for this profile (cheap query)
  const { count: sessions } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  const monthsElapsed = Math.floor(
    (now.getTime() - new Date(latest.promoted_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const sessionsOk = !nextBelt.min_sessions || (sessions ?? 0) >= nextBelt.min_sessions
  const monthsOk = !nextBelt.min_time_months || monthsElapsed >= nextBelt.min_time_months
  if (!sessionsOk || !monthsOk) continue

  promotionsReady.push({
    profileId,
    memberName: latest.full_name,
    currentBelt: currentBelt.name,
    currentBeltColor: currentBelt.color_hex,
    nextBelt: nextBelt.name,
    nextBeltColor: nextBelt.color_hex,
    sessions: sessions ?? 0,
    months: monthsElapsed,
  })
}

// Sort by months desc and take top 3 for dashboard
promotionsReady.sort((a, b) => b.months - a.months)
const promotionsTop3 = promotionsReady.slice(0, 3)

// Fetch leads grouped by status
const { data: allLeads } = await supabase
  .from('leads')
  .select('id, full_name, source, status, created_at')
  .order('created_at', { ascending: false })

const leadsByStatus: LeadsByStatus = {
  new: [], contacted: [], converted: [], lost: [],
  totals: { new: 0, contacted: 0, converted: 0, lost: 0 },
}
for (const row of (allLeads ?? []) as LeadCard[]) {
  const bucket = row.status
  if (!(bucket in leadsByStatus.totals)) continue
  leadsByStatus.totals[bucket] += 1
  if (leadsByStatus[bucket].length < 2) leadsByStatus[bucket].push(row)
}

return {
  ...base,
  activeMembers: membersResult.count ?? 0,
  newLeads: leadsResult.count ?? 0,
  promotionsReady: promotionsTop3,
  leadsByStatus,
}
```

Remove the old promotionsReady loop that returned `nextBelt: '—'`.

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run app/actions/__tests__/admin.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin.ts app/actions/__tests__/admin.test.ts
git commit -m "feat(admin): extend getAdminDashboard with real next belt and leadsByStatus"
```

---

## Task 7: AdminNav update — remove Phase 2b stubs

**Files:**
- Modify: `components/admin/AdminNav.tsx`

- [ ] **Step 1: Remove the `phase2b` flag on the three items**

In `components/admin/AdminNav.tsx`, locate the `managementItems` array and remove `phase2b: true` from the `guertel`, `leads`, and `einstellungen` entries. Result:

```typescript
const managementItems: NavItem[] = [
  { href: '/admin/mitglieder',    label: 'Mitglieder',    Icon: Users },
  { href: '/admin/guertel',       label: 'Gürtel',        Icon: Award },
  { href: '/admin/leads',         label: 'Leads',         Icon: ClipboardList },
  { href: '/admin/einstellungen', label: 'Einstellungen', Icon: Settings },
]
```

- [ ] **Step 2: Remove the "Bald" stub branch in `NavContent`**

Inside `NavContent`, the `managementItems.map(...)` block has an `if (phase2b)` branch that renders a disabled stub. Delete that branch. Also remove the `phase2b` property from the `NavItem` interface. The map becomes simply:

```typescript
{managementItems.map(({ href, label, Icon }) => {
  const active = isActive(href)
  return (
    <Link
      key={href}
      href={href}
      onClick={onItemClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
})}
```

And update the interface:

```typescript
interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminNav.tsx
git commit -m "feat(admin): unlock Phase 2b nav items (guertel, leads, einstellungen)"
```

---

## Task 8: Dashboard widgets — PromotionsWidget + LeadsMiniKanban

**Files:**
- Create: `components/admin/PromotionsWidget.tsx`
- Create: `components/admin/LeadsMiniKanban.tsx`

- [ ] **Step 1: Create `PromotionsWidget.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { promoteToNextBelt } from '@/app/actions/promotions'
import type { PromotionReady } from '@/app/actions/admin'

interface Props {
  promotions: PromotionReady[]
}

export function PromotionsWidget({ promotions }: Props) {
  const [localPromotions, setLocalPromotions] = useState(promotions)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [donePromotions, setDonePromotions] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onPromote(profileId: string) {
    setError(null)
    startTransition(async () => {
      const result = await promoteToNextBelt(profileId)
      if (result.error) {
        setError(result.error)
        setConfirmId(null)
        return
      }
      setDonePromotions(prev => ({ ...prev, [profileId]: result.newBeltName ?? '✓' }))
      setConfirmId(null)
      setTimeout(() => {
        setLocalPromotions(prev => prev.filter(p => p.profileId !== profileId))
      }, 1500)
    })
  }

  if (localPromotions.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Gürtel Promotions
        </p>
        <p className="text-sm text-muted-foreground">Keine Promotions bereit</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Gürtel Promotions
        </p>
        <a href="/admin/guertel" className="text-xs font-bold text-primary">Alle →</a>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {localPromotions.map(p => {
          const done = donePromotions[p.profileId]
          const isConfirming = confirmId === p.profileId
          return (
            <li key={p.profileId} className={`flex items-center justify-between py-2 ${done ? 'opacity-50' : ''}`}>
              <div>
                <p className={`text-sm font-bold ${done ? 'line-through' : 'text-foreground'}`}>
                  {p.memberName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.currentBelt} → <span style={{ color: p.nextBeltColor ?? undefined }} className="font-bold">{p.nextBelt}</span>
                </p>
              </div>
              {done ? (
                <span className="bg-[#4caf50] px-2 py-1 text-[10px] font-bold text-white">✓ {done}</span>
              ) : isConfirming ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => onPromote(p.profileId)}
                    disabled={isPending}
                    className="bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground"
                  >
                    Abbr.
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(p.profileId)}
                  className="bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground"
                >
                  JETZT
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create `LeadsMiniKanban.tsx`**

```typescript
import Link from 'next/link'
import type { LeadsByStatus } from '@/app/actions/admin'

interface Props {
  data: LeadsByStatus
}

export function LeadsMiniKanban({ data }: Props) {
  const columns: Array<{ key: keyof LeadsByStatus['totals']; label: string; accent?: string }> = [
    { key: 'new', label: 'Neu', accent: 'text-primary' },
    { key: 'contacted', label: 'Kontakt.' },
    { key: 'converted', label: 'Konvert.', accent: 'text-[#2e7d32]' },
    { key: 'lost', label: 'Verloren', accent: 'text-destructive' },
  ]

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Leads Pipeline
        </p>
        <Link href="/admin/leads" className="text-xs font-bold text-primary">
          Vollansicht →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {columns.map(col => {
          const items = data[col.key] as { id: string; full_name: string; source: string }[]
          return (
            <div key={col.key}>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${col.accent ?? 'text-muted-foreground'}`}>
                {col.label} · {data.totals[col.key]}
              </p>
              <div className="space-y-1">
                {items.map(lead => (
                  <div key={lead.id} className="border border-border bg-background p-2">
                    <p className="truncate text-xs font-bold text-foreground">{lead.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {lead.source === 'instagram' ? '📸' : '🌐'} {lead.source}
                    </p>
                  </div>
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

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/PromotionsWidget.tsx components/admin/LeadsMiniKanban.tsx
git commit -m "feat(admin): add PromotionsWidget and LeadsMiniKanban dashboard widgets"
```

---

## Task 9: Dashboard page integration

**Files:**
- Modify: `app/(admin)/admin/dashboard/page.tsx`

- [ ] **Step 1: Import and render the new widgets (owner-only)**

At the top:

```typescript
import { PromotionsWidget } from '@/components/admin/PromotionsWidget'
import { LeadsMiniKanban } from '@/components/admin/LeadsMiniKanban'
```

Replace the existing read-only promotions section (the one referencing `data.promotionsReady` that says "Gürtelpromotion kommt in Phase 2b") with the new widget. Owner-only rendering:

```tsx
{role === 'owner' && data.promotionsReady && (
  <PromotionsWidget promotions={data.promotionsReady} />
)}
{role === 'owner' && data.leadsByStatus && (
  <div className="mt-6">
    <LeadsMiniKanban data={data.leadsByStatus} />
  </div>
)}
```

Place `PromotionsWidget` next to the upcoming-class card in the same grid row (use `grid-cols-1 lg:grid-cols-2 gap-6` container). Place `LeadsMiniKanban` as a full-width row below "Today's schedule".

- [ ] **Step 2: Add a 5th stat card — "Promotions bereit" count (owner only)**

In the stat grid, for owner add:

```tsx
{role === 'owner' && (
  <AdminStatCard label="Promotions bereit" value={data.promotionsReady?.length ?? 0} />
)}
```

And change the owner grid class from `sm:grid-cols-3` to `sm:grid-cols-5`.

- [ ] **Step 3: Verify TypeScript + run full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/dashboard/page.tsx"
git commit -m "feat(admin): render PromotionsWidget and LeadsMiniKanban on owner dashboard"
```

---

## Task 10: /admin/guertel page + components

**Files:**
- Create: `components/admin/BeltEligibilityList.tsx`
- Create: `components/admin/PromotionHistory.tsx`
- Create: `app/(admin)/admin/guertel/page.tsx`

- [ ] **Step 1: Create `BeltEligibilityList.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { promoteToNextBelt } from '@/app/actions/promotions'
import type { PromotionReady } from '@/app/actions/admin'

interface Props {
  eligible: PromotionReady[]
}

export function BeltEligibilityList({ eligible }: Props) {
  const [local, setLocal] = useState(eligible)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onPromote(profileId: string, name: string, nextBelt: string) {
    if (!confirm(`${name} zu ${nextBelt} befördern?`)) return
    setError(null)
    startTransition(async () => {
      const result = await promoteToNextBelt(profileId)
      if (result.error) { setError(result.error); return }
      setLocal(prev => prev.filter(p => p.profileId !== profileId))
    })
  }

  if (local.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Bereit zu promoten
        </p>
        <p className="text-sm text-muted-foreground">Keine Promotions bereit</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Bereit zu promoten ({local.length})
      </p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {local.map(p => (
          <li key={p.profileId} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-foreground">{p.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {p.currentBelt} → <span style={{ color: p.nextBeltColor ?? undefined }} className="font-bold">{p.nextBelt}</span>
                <span className="ml-2 font-mono">{p.sessions} Sessions · {p.months} Monate</span>
              </p>
            </div>
            <button
              onClick={() => onPromote(p.profileId, p.memberName, p.nextBelt)}
              disabled={isPending}
              className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              PROMOTEN
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Create `PromotionHistory.tsx`**

```typescript
interface HistoryRow {
  promotedAt: string
  memberName: string
  fromBelt: string | null
  fromBeltColor: string | null
  toBelt: string
  toBeltColor: string | null
  promotedByName: string | null
}

interface Props { rows: HistoryRow[] }

export function PromotionHistory({ rows }: Props) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Promotions-History
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Promotions.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r, i) => (
            <li key={i} className="py-2">
              <p className="text-sm font-bold text-foreground">{r.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {r.fromBelt ? (
                  <>
                    <span style={{ color: r.fromBeltColor ?? undefined }}>{r.fromBelt}</span>
                    {' → '}
                  </>
                ) : '— → '}
                <span style={{ color: r.toBeltColor ?? undefined }} className="font-bold">{r.toBelt}</span>
                <span className="ml-2 font-mono text-muted-foreground">{formatDate(r.promotedAt)}</span>
                {r.promotedByName && <span className="ml-2 text-muted-foreground">· {r.promotedByName}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(admin)/admin/guertel/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboard } from '@/app/actions/admin'
import { BeltEligibilityList } from '@/components/admin/BeltEligibilityList'
import { PromotionHistory } from '@/components/admin/PromotionHistory'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gürtel | Admin' }

export default async function GuertelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  // Use getAdminDashboard to get the eligibility list
  const dashboard = await getAdminDashboard()
  // Note: getAdminDashboard returns top 3; for the /admin/guertel page we want ALL eligible.
  // Build a dedicated query below.

  // Build eligibility: reuse admin logic by calling it with a different cap? Cleaner: query directly.
  // For simplicity here, reuse the dashboard top 3 plus issue an extended query client-side isn't safe on a server page.
  // Instead, replicate the query here fully.

  // Eligible members — fetch all profile_ranks (most recent per profile) and compute eligibility
  const { data: allBelts } = await supabase
    .from('belt_ranks')
    .select('id, name, order, color_hex, min_sessions, min_time_months')
    .order('order', { ascending: true })
  type BeltRow = { id: string; name: string; order: number; color_hex: string | null; min_sessions: number | null; min_time_months: number | null }
  const beltList = (allBelts ?? []) as BeltRow[]
  const beltById = new Map(beltList.map(b => [b.id, b]))
  const beltByOrder = new Map(beltList.map(b => [b.order, b]))

  const { data: ranksRaw } = await supabase
    .from('profile_ranks')
    .select(`profile_id, belt_rank_id, promoted_at, promoted_by, profiles(full_name)`)
    .order('promoted_at', { ascending: false })

  const latestByProfile = new Map<string, { belt_rank_id: string; promoted_at: string; full_name: string }>()
  for (const row of ranksRaw ?? []) {
    if (latestByProfile.has(row.profile_id as string)) continue
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const profileObj = rawProfile as { full_name: string } | null
    latestByProfile.set(row.profile_id as string, {
      belt_rank_id: row.belt_rank_id as string,
      promoted_at: row.promoted_at as string,
      full_name: profileObj?.full_name ?? 'Unbekannt',
    })
  }

  const now = new Date()
  const eligible = [] as Awaited<ReturnType<typeof getAdminDashboard>>['promotionsReady']
  const eligibleArr: NonNullable<typeof eligible> = []
  for (const [profileId, latest] of latestByProfile) {
    const currentBelt = beltById.get(latest.belt_rank_id)
    if (!currentBelt) continue
    const nextBelt = beltByOrder.get(currentBelt.order + 1)
    if (!nextBelt) continue
    const { count: sessions } = await supabase
      .from('attendances').select('*', { count: 'exact', head: true }).eq('profile_id', profileId)
    const monthsElapsed = Math.floor((now.getTime() - new Date(latest.promoted_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    const sessionsOk = !nextBelt.min_sessions || (sessions ?? 0) >= nextBelt.min_sessions
    const monthsOk = !nextBelt.min_time_months || monthsElapsed >= nextBelt.min_time_months
    if (!sessionsOk || !monthsOk) continue
    eligibleArr.push({
      profileId, memberName: latest.full_name,
      currentBelt: currentBelt.name, currentBeltColor: currentBelt.color_hex,
      nextBelt: nextBelt.name, nextBeltColor: nextBelt.color_hex,
      sessions: sessions ?? 0, months: monthsElapsed,
    })
  }
  eligibleArr.sort((a, b) => b.months - a.months)

  // History — last 30 rows sorted asc per profile, compute "from" via the row immediately prior
  const historyRaw = ranksRaw ?? []
  // Build a per-profile ascending index to find the prior belt_rank_id
  const profileAscIndex = new Map<string, { belt_rank_id: string; promoted_at: string }[]>()
  for (const row of historyRaw) {
    const list = profileAscIndex.get(row.profile_id as string) ?? []
    list.push({ belt_rank_id: row.belt_rank_id as string, promoted_at: row.promoted_at as string })
    profileAscIndex.set(row.profile_id as string, list)
  }
  for (const list of profileAscIndex.values()) list.sort((a, b) => a.promoted_at.localeCompare(b.promoted_at))

  // Fetch promoter names in one pass
  const promoterIds = Array.from(new Set((historyRaw as any[]).map(r => r.promoted_by).filter(Boolean))) as string[]
  const promoterMap = new Map<string, string>()
  if (promoterIds.length > 0) {
    const { data: promoters } = await supabase
      .from('profiles').select('id, full_name').in('id', promoterIds)
    for (const p of (promoters ?? []) as { id: string; full_name: string }[]) {
      promoterMap.set(p.id, p.full_name)
    }
  }

  const historyRows = (historyRaw as any[]).slice(0, 30).map(row => {
    const ascList = profileAscIndex.get(row.profile_id as string) ?? []
    const currentIdx = ascList.findIndex(x => x.promoted_at === row.promoted_at && x.belt_rank_id === row.belt_rank_id)
    const prior = currentIdx > 0 ? ascList[currentIdx - 1] : null
    const priorBelt = prior ? beltById.get(prior.belt_rank_id) : null
    const toBelt = beltById.get(row.belt_rank_id as string)
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      promotedAt: row.promoted_at as string,
      memberName: (rawProfile as { full_name: string } | null)?.full_name ?? 'Unbekannt',
      fromBelt: priorBelt?.name ?? null,
      fromBeltColor: priorBelt?.color_hex ?? null,
      toBelt: toBelt?.name ?? '—',
      toBeltColor: toBelt?.color_hex ?? null,
      promotedByName: row.promoted_by ? promoterMap.get(row.promoted_by as string) ?? null : null,
    }
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Gürtelpromotions</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <BeltEligibilityList eligible={eligibleArr} />
        <PromotionHistory rows={historyRows} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/BeltEligibilityList.tsx components/admin/PromotionHistory.tsx "app/(admin)/admin/guertel/page.tsx"
git commit -m "feat(admin): add /admin/guertel page with eligibility list and history"
```

---

## Task 11: /admin/leads page (Kanban + List + Create form)

**Files:**
- Create: `components/admin/LeadForm.tsx`
- Create: `components/admin/LeadsKanban.tsx`
- Create: `components/admin/LeadsListView.tsx`
- Create: `app/(admin)/admin/leads/page.tsx`

- [ ] **Step 1: Create `LeadForm.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { createLead } from '@/app/actions/leads'

interface Props { onClose: () => void; onCreated: () => void }

export function LeadForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '', source: 'website' as 'website' | 'instagram' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createLead({
        full_name: form.full_name, email: form.email,
        phone: form.phone || undefined, message: form.message || undefined,
        source: form.source,
      })
      if (result.error) { setError(result.error); return }
      onCreated()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">Neuer Lead</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Name"
               value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="E-Mail" type="email"
               value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Telefon (optional)"
               value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <textarea className="w-full border border-border bg-background p-2 text-sm" placeholder="Nachricht (optional)" rows={3}
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <select className="w-full border border-border bg-background p-2 text-sm"
                value={form.source} onChange={e => setForm({ ...form, source: e.target.value as 'website' | 'instagram' })}>
          <option value="website">Website</option>
          <option value="instagram">Instagram</option>
        </select>
        <div className="flex gap-2">
          <button onClick={submit} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            Erstellen
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `LeadsKanban.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'

type Status = 'new' | 'contacted' | 'converted' | 'lost'
export interface Lead {
  id: string
  full_name: string
  email: string
  source: 'website' | 'instagram'
  status: Status
  created_at: string
}

interface Props { initialLeads: Lead[] }

export function LeadsKanban({ initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [isPending, startTransition] = useTransition()

  function move(leadId: string, newStatus: Status) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    startTransition(async () => {
      await updateLeadStatus(leadId, newStatus)
    })
  }

  function renderActions(l: Lead) {
    const btn = (label: string, next: Status, variant: 'primary' | 'muted' | 'danger' = 'muted') => (
      <button key={next}
              onClick={() => move(l.id, next)} disabled={isPending}
              className={`px-2 py-1 text-[10px] font-bold disabled:opacity-50 ${
                variant === 'primary' ? 'bg-primary text-primary-foreground'
                : variant === 'danger' ? 'border border-destructive text-destructive'
                : 'border border-border'
              }`}>{label}</button>
    )
    if (l.status === 'new') return [btn('Kontaktiert →', 'contacted'), btn('Verloren', 'lost', 'danger')]
    if (l.status === 'contacted') return [btn('Konvertiert →', 'converted', 'primary'), btn('Verloren', 'lost', 'danger')]
    if (l.status === 'lost') return [btn('Wiederaufnehmen → Neu', 'new')]
    return []
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  }

  const columns: Array<{ key: Status; label: string; bg: string }> = [
    { key: 'new', label: 'Neu', bg: 'bg-muted/40' },
    { key: 'contacted', label: 'Kontaktiert', bg: 'bg-muted/40' },
    { key: 'converted', label: 'Konvertiert', bg: 'bg-[#e8f5e9]' },
    { key: 'lost', label: 'Verloren', bg: 'bg-[#fdf5f5]' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map(col => {
        const items = leads.filter(l => l.status === col.key)
        return (
          <div key={col.key} className={`${col.bg} p-3`}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {col.label} · {items.length}
            </p>
            <div className="space-y-2">
              {items.map(l => (
                <div key={l.id} className="border border-border bg-card p-3">
                  <p className="text-sm font-bold">{l.full_name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {l.source === 'instagram' ? '📸' : '🌐'} {l.source} · {formatDate(l.created_at)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{l.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{renderActions(l)}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create `LeadsListView.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'
import type { Lead } from './LeadsKanban'

interface Props { leads: Lead[] }

export function LeadsListView({ leads }: Props) {
  const [isPending, startTransition] = useTransition()

  function onChange(leadId: string, status: Lead['status']) {
    startTransition(async () => { await updateLeadStatus(leadId, status) })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">E-Mail</th>
            <th className="p-3">Quelle</th>
            <th className="p-3">Status</th>
            <th className="p-3">Datum</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id} className="border-b border-border">
              <td className="p-3 font-bold">{l.full_name}</td>
              <td className="p-3 text-muted-foreground">{l.email}</td>
              <td className="p-3">{l.source === 'instagram' ? '📸 Instagram' : '🌐 Website'}</td>
              <td className="p-3">
                <select value={l.status}
                        disabled={isPending}
                        onChange={e => onChange(l.id, e.target.value as Lead['status'])}
                        className="border border-border bg-background p-1 text-xs">
                  <option value="new">Neu</option>
                  <option value="contacted">Kontaktiert</option>
                  <option value="converted">Konvertiert</option>
                  <option value="lost">Verloren</option>
                </select>
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{formatDate(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(admin)/admin/leads/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LeadsKanban, type Lead } from '@/components/admin/LeadsKanban'
import { LeadsListView } from '@/components/admin/LeadsListView'
import { LeadsActions } from '@/components/admin/LeadsActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leads | Admin' }

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const params = await searchParams
  const view = params.view === 'list' ? 'list' : 'kanban'

  const { data } = await supabase
    .from('leads')
    .select('id, full_name, email, source, status, created_at')
    .order('created_at', { ascending: false })

  const leads = (data ?? []) as Lead[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-4 text-2xl font-black text-foreground">Leads</h1>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <Link href="/admin/leads?view=kanban"
                className={`px-3 py-1.5 text-xs font-bold ${view === 'kanban' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
            KANBAN
          </Link>
          <Link href="/admin/leads?view=list"
                className={`px-3 py-1.5 text-xs font-bold ${view === 'list' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
            LISTE
          </Link>
        </div>
        <LeadsActions />
      </div>
      {view === 'kanban' ? <LeadsKanban initialLeads={leads} /> : <LeadsListView leads={leads} />}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/admin/LeadsActions.tsx` (the "+ NEUER LEAD" button that opens LeadForm)**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeadForm } from './LeadForm'

export function LeadsActions() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button onClick={() => setOpen(true)}
              className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        + NEUER LEAD
      </button>
      {open && (
        <LeadForm
          onClose={() => setOpen(false)}
          onCreated={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/admin/LeadForm.tsx components/admin/LeadsKanban.tsx components/admin/LeadsListView.tsx components/admin/LeadsActions.tsx "app/(admin)/admin/leads/page.tsx"
git commit -m "feat(admin): add /admin/leads page with kanban, list, and create form"
```

---

## Task 12: MemberEditPanel + wire into MemberTable

**Files:**
- Create: `components/admin/MemberEditPanel.tsx`
- Modify: `components/admin/MemberTable.tsx`

- [ ] **Step 1: Create `MemberEditPanel.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateMember } from '@/app/actions/members'
import { useRouter } from 'next/navigation'

export interface MemberDetail {
  id: string
  full_name: string
  phone: string | null
  date_of_birth: string | null
  role: 'member' | 'coach' | 'owner'
}

interface Props {
  member: MemberDetail
  viewerRole: 'coach' | 'owner'
  onClose: () => void
}

export function MemberEditPanel({ member, viewerRole, onClose }: Props) {
  const [form, setForm] = useState({
    full_name: member.full_name,
    phone: member.phone ?? '',
    date_of_birth: member.date_of_birth ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const readOnly = viewerRole !== 'owner'

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateMember(member.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{member.full_name}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.full_name} disabled={readOnly}
                 onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Telefon</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.phone} disabled={readOnly}
                 onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Geburtsdatum</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.date_of_birth} disabled={readOnly}
                 onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Rolle</label>
          <p className="text-sm font-bold capitalize">{member.role}</p>
          <p className="text-[10px] text-muted-foreground">Rolle ändern: /admin/einstellungen</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={isPending}
                    className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              Speichern
            </button>
            <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Modify `MemberTable.tsx` to open `MemberEditPanel`**

Replace the existing row-click handler that opens a read-only modal with opening `MemberEditPanel`. Props change: `MemberTable` now requires `viewerRole`.

At the top add:
```typescript
import { MemberEditPanel, type MemberDetail } from './MemberEditPanel'
```

Add `viewerRole: 'coach' | 'owner'` to the `Props` interface.

Add state:
```typescript
const [selected, setSelected] = useState<MemberDetail | null>(null)
```

In each row's onClick, call `setSelected({ id: m.id, full_name: m.full_name, phone: m.phone, date_of_birth: m.date_of_birth, role: m.role })`. Ensure `MemberTable`'s member type includes `phone`, `date_of_birth`, `role` — adjust the `Member` type and the `/admin/mitglieder/page.tsx` fetch to include those columns.

At the bottom of the JSX, render:
```typescript
{selected && (
  <MemberEditPanel member={selected} viewerRole={viewerRole} onClose={() => setSelected(null)} />
)}
```

- [ ] **Step 3: Update `app/(admin)/admin/mitglieder/page.tsx`**

Pass `viewerRole` to `MemberTable` and include the extra fields in the profiles query. Locate the fetch:

```typescript
.select('id, full_name, created_at, phone, date_of_birth, role')
```

And pass `viewerRole={role}` (owner/coach, looked up at page top via `createClient` + `profiles.role`).

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/MemberEditPanel.tsx components/admin/MemberTable.tsx "app/(admin)/admin/mitglieder/page.tsx"
git commit -m "feat(admin): add MemberEditPanel and wire owner edit into /admin/mitglieder"
```

---

## Task 13: /admin/einstellungen page + components

**Files:**
- Create: `components/admin/ClassTypeForm.tsx`
- Create: `components/admin/ClassTypeTable.tsx`
- Create: `components/admin/RoleManager.tsx`
- Create: `app/(admin)/admin/einstellungen/page.tsx`

- [ ] **Step 1: Create `ClassTypeForm.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { upsertClassType } from '@/app/actions/class-types'
import { useRouter } from 'next/navigation'

export interface ClassTypeRow {
  id?: string
  name: string
  description: string | null
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

interface Props { initial?: ClassTypeRow; onClose: () => void }

export function ClassTypeForm({ initial, onClose }: Props) {
  const [form, setForm] = useState<ClassTypeRow>(initial ?? { name: '', description: '', level: 'all', gi: true })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await upsertClassType({
        id: initial?.id,
        name: form.name,
        description: form.description ?? undefined,
        level: form.level,
        gi: form.gi,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{initial ? 'Klassentyp bearbeiten' : 'Neuer Klassentyp'}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Name"
               value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full border border-border bg-background p-2 text-sm" placeholder="Beschreibung" rows={3}
                  value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        <select className="w-full border border-border bg-background p-2 text-sm"
                value={form.level} onChange={e => setForm({ ...form, level: e.target.value as ClassTypeRow['level'] })}>
          <option value="beginner">Anfänger</option>
          <option value="all">Alle</option>
          <option value="advanced">Fortgeschritten</option>
          <option value="kids">Kids</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.gi} onChange={e => setForm({ ...form, gi: e.target.checked })} />
          Mit Gi
        </label>
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

- [ ] **Step 2: Create `ClassTypeTable.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { deleteClassType } from '@/app/actions/class-types'
import { ClassTypeForm, type ClassTypeRow } from './ClassTypeForm'
import { useRouter } from 'next/navigation'

interface Props { types: ClassTypeRow[] }

export function ClassTypeTable({ types }: Props) {
  const [editing, setEditing] = useState<ClassTypeRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function remove(t: ClassTypeRow) {
    if (!t.id) return
    if (!confirm('Klassentyp löschen?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteClassType(t.id!)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Klassentypen</p>
        <button onClick={() => setCreating(true)}
                className="bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
          + NEU
        </button>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {types.map(t => (
          <li key={t.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{labelForLevel(t.level)} · {t.gi ? 'Gi' : 'No-Gi'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(t)} className="border border-border px-2 py-1 text-[10px]">Edit</button>
              <button onClick={() => remove(t)} disabled={isPending}
                      className="border border-destructive px-2 py-1 text-[10px] text-destructive">✕</button>
            </div>
          </li>
        ))}
      </ul>
      {creating && <ClassTypeForm onClose={() => setCreating(false)} />}
      {editing && <ClassTypeForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function labelForLevel(level: string) {
  return ({ beginner: 'Anfänger', all: 'Alle', advanced: 'Fortgeschritten', kids: 'Kids' } as Record<string, string>)[level] ?? level
}
```

- [ ] **Step 3: Create `RoleManager.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateMemberRole } from '@/app/actions/members'
import { useRouter } from 'next/navigation'

interface Profile { id: string; full_name: string; role: 'member' | 'coach' | 'owner' }

interface Props { coaches: Profile[]; members: Profile[] }

export function RoleManager({ coaches, members }: Props) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = members.filter(m => m.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

  function change(id: string, role: 'member' | 'coach', label: string) {
    if (!confirm(label)) return
    setError(null)
    startTransition(async () => {
      const result = await updateMemberRole(id, role)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Rollen & Zugänge</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Coaches</p>
      <ul className="mb-4 divide-y divide-border">
        {coaches.length === 0 && <li className="py-2 text-sm text-muted-foreground">Keine Coaches</li>}
        {coaches.map(c => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span className="text-sm font-bold">{c.full_name} <span className="text-xs font-normal text-muted-foreground">Coach</span></span>
            <button onClick={() => change(c.id, 'member', `${c.full_name} zum Mitglied machen?`)}
                    disabled={isPending}
                    className="border border-border px-2 py-1 text-[10px] text-primary disabled:opacity-50">
              → Mitglied
            </button>
          </li>
        ))}
      </ul>

      <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Mitglied zum Coach machen</p>
      <input className="mb-2 w-full border border-border bg-background p-2 text-sm" placeholder="Name suchen ..."
             value={query} onChange={e => setQuery(e.target.value)} />
      {query && (
        <ul className="divide-y divide-border">
          {filtered.length === 0 && <li className="py-2 text-sm text-muted-foreground">Keine Treffer</li>}
          {filtered.map(m => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-bold">{m.full_name}</span>
              <button onClick={() => change(m.id, 'coach', `${m.full_name} zum Coach machen?`)}
                      disabled={isPending}
                      className="bg-foreground px-2 py-1 text-[10px] font-bold text-background disabled:opacity-50">
                → Coach
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(admin)/admin/einstellungen/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassTypeTable } from '@/components/admin/ClassTypeTable'
import { RoleManager } from '@/components/admin/RoleManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Einstellungen | Admin' }

export default async function EinstellungenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const [classTypesResult, coachesResult, membersResult] = await Promise.all([
    supabase.from('class_types').select('id, name, description, level, gi').order('name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'coach').order('full_name'),
    supabase.from('profiles').select('id, full_name, role').eq('role', 'member').order('full_name'),
  ])

  const types = (classTypesResult.data ?? []) as {
    id: string; name: string; description: string | null;
    level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean
  }[]
  const coaches = (coachesResult.data ?? []) as { id: string; full_name: string; role: 'coach' }[]
  const members = (membersResult.data ?? []) as { id: string; full_name: string; role: 'member' }[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Einstellungen</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassTypeTable types={types} />
        <RoleManager coaches={coaches} members={members} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: TypeScript + full test run**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no TS errors; all existing + new tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ClassTypeForm.tsx components/admin/ClassTypeTable.tsx components/admin/RoleManager.tsx "app/(admin)/admin/einstellungen/page.tsx"
git commit -m "feat(admin): add /admin/einstellungen page with class types and role manager"
```

---

## Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass (128 baseline + ~15 new from Tasks 2–6 = ~143 tests).

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build smoke test (optional but recommended)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual smoke test checklist (document in PR description)**
  - [ ] As owner, visit `/admin/dashboard` — see 5 stat cards, PromotionsWidget, LeadsMiniKanban
  - [ ] Click "JETZT" on a promotion → confirm → row fades with "✓ <belt>"
  - [ ] Visit `/admin/guertel` — see eligibility list + history with "from → to" belts
  - [ ] Visit `/admin/leads` — kanban default; click "Kontaktiert →" on a "Neu" card → card moves
  - [ ] Toggle to LISTE view — same data shown as table with status dropdowns
  - [ ] Click "+ NEUER LEAD" → fill form → lead appears in "Neu" column
  - [ ] Visit `/admin/mitglieder` → click a row → edit panel slides in → change name + save → row updates
  - [ ] Visit `/admin/einstellungen` → add a new class type → appears in list; edit + delete
  - [ ] In `/admin/einstellungen` RoleManager → search a member → promote to coach → appears in Coaches list

---

## Summary

**13 tasks total.** Each task is self-contained: new file(s), tests, commit. After completion, the admin section has a complete command-center dashboard (real-time widgets for promotions and leads) plus four fully-operational management pages (`/admin/guertel`, `/admin/leads`, enhanced `/admin/mitglieder`, `/admin/einstellungen`). All server actions are role-guarded; no new DB tables required.
