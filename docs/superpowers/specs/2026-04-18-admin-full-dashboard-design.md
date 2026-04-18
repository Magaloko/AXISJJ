# AXISJJ Admin — Full Dashboard & Phase 2b Design Spec

**Date:** 2026-04-18
**Scope:** Expand the Phase 2a admin section into a complete "command center" — enhanced dashboard with action widgets, plus full Phase 2b pages: belt promotions, leads pipeline, member editing, gym settings (class types + role management).

**Prerequisite:** Phase 2a (PR #6 on `feature/phase6-admin-ops`) must be merged to `main` first — this design builds on top of it.

---

## 1. Goals

Give the owner one dashboard that shows everything running in the gym at a glance, with inline actions for the most common flows (promote a member, move a lead forward). Back that with dedicated detail pages where full management happens: belt history, leads pipeline, member editing, and gym configuration.

Coaches get the read-only view of everything except settings and role management, which are owner-only.

---

## 2. Roles & Access

| Feature | coach | owner |
|---|---|---|
| Enhanced dashboard (stats + schedule) | ✓ | ✓ |
| Promotions widget (view only) | ✓ | — |
| Promotions widget (promote action) | — | ✓ |
| Leads mini-kanban (view only) | ✓ | — |
| Leads mini-kanban (visible) | — | ✓ |
| `/admin/guertel` | — | ✓ |
| `/admin/leads` | — | ✓ |
| `/admin/mitglieder` (view) | ✓ | ✓ |
| `/admin/mitglieder` (edit) | — | ✓ |
| `/admin/einstellungen` | — | ✓ |

Middleware at `middleware.ts` already guards `/admin/*` for coach+owner. Additional owner-only checks happen in server actions and page guards.

---

## 3. Architecture

### Route Structure

```
app/(admin)/admin/
├── dashboard/page.tsx        ← enhanced (new widgets)
├── checkin/page.tsx          ← unchanged (Phase 2a)
├── klassen/page.tsx          ← unchanged (Phase 2a)
├── mitglieder/page.tsx       ← enhanced (edit panel)
├── guertel/page.tsx          ← NEW
├── leads/page.tsx            ← NEW
└── einstellungen/page.tsx    ← NEW
```

### AdminNav Update

Phase 2b items (`Gürtel`, `Leads`, `Einstellungen`) become clickable — the "Bald verfügbar" badge and `disabled` state are removed. The nav structure stays identical (OPS group + MANAGEMENT group for owner, OPS only for coach).

`components/admin/AdminNav.tsx` — modify `isPhase2b` flag logic to treat these three items as active (clickable links with normal active-state styling).

### Data Updates Strategy

Server-first rendering (fast initial load), server actions with `revalidatePath` after each mutation. Widgets that take action (promotions, lead status) use `useTransition` for optimistic UI. No polling — the page refreshes data only after an action occurs or on navigation.

---

## 4. Enhanced Dashboard (`/admin/dashboard`)

### Owner View

Adds two new widgets to the existing dashboard:

**Layout (owner):**
```
Row 1: 5 stat cards — Mitglieder | Neue Leads | Check-Ins heute | Buchungen heute | Promotions bereit
Row 2: [Nächste Klasse card] [Promotions Widget — NEW]
Row 3: [Heute Schedule] [Leads Mini-Kanban — NEW, 2/3 width]
```

**Coach View:**

Same 4 stat cards as Phase 2a (no "Promotions bereit" card, no promotions widget, no leads mini-kanban). Unchanged from Phase 2a.

### PromotionsWidget (owner-only)

Shows up to 3 eligible members ranked by `months_in_grade DESC`. Each row:
- Member name (bold)
- `<current belt> → <next belt>` with colored next-belt label
- "JETZT" button (primary color)

Clicking "JETZT" → inline confirm state (button becomes "Sicher? · Ja/Abbrechen") → on confirm calls `promoteToNextBelt(profileId)` inside `useTransition`. On success: row fades with strike-through and shows "✓ Befördert", then `revalidatePath('/admin/dashboard')` refreshes the list.

"Alle →" link at top-right of the widget → navigates to `/admin/guertel`.

### LeadsMiniKanban (owner-only)

Four columns: Neu | Kontaktiert | Konvertiert | Verloren. Each column shows count badge + up to 2 most recent leads as mini-cards (name + source icon). Read-only — clicking a card navigates to `/admin/leads`. "Vollansicht →" link at top-right.

Data fetched in parallel with other dashboard queries via `getAdminDashboard()`.

### `getAdminDashboard()` Updates

Extend the existing server action to also return (owner-only):
- `promotionsReady: Array<{ profile_id, full_name, current_belt_name, current_belt_color, next_belt_name, next_belt_color, sessions, months }>` — top 3 sorted by months_in_grade desc
- `leadsByStatus: { new: Lead[], contacted: Lead[], converted: Lead[], lost: Lead[] }` — top 2 per column sorted by created_at desc, plus total counts per status

---

## 5. Belt Promotions Page (`/admin/guertel`)

Two-column layout (1:1 on desktop, stacked on mobile).

### Left: `BeltEligibilityList`

Query: members where:
- Current belt's next rank (by `belt_ranks.order + 1`) exists
- Total `attendances.count` >= next belt's `min_sessions`
- `months_in_grade` (derived from latest `profile_ranks.promoted_at`) >= next belt's `min_time_months`

Each row: name, current → next belt (colored swatches), session count (mono), months in grade (mono), "PROMOTEN" button.

Clicking "PROMOTEN" → confirm dialog (native `confirm()` or custom, but MUST confirm) → `promoteToNextBelt(profileId)` → row disappears from list on success.

If no eligible members: empty state ("Keine Promotions bereit").

### Right: `PromotionHistory`

Query: `profile_ranks` ORDER BY `promoted_at DESC` LIMIT 30, joined with `profiles` and `belt_ranks`. To show "from belt", use a SQL window function: `LAG(belt_rank_id) OVER (PARTITION BY profile_id ORDER BY promoted_at ASC)`. If no prior rank row exists (first promotion ever), show "—" for "from belt".

Each row: member name, `<from belt> → <to belt>` with colored swatches, date (`DD. MMM YYYY`), optionally coach name (`promoted_by`).

---

## 6. Leads Pipeline (`/admin/leads`)

### Toggle

Top bar: two pill-buttons — "KANBAN" (default, active) | "LISTE". State stored in URL search param `?view=kanban|list` for shareability. Second element: "+ NEUER LEAD" primary button (top-right).

### `LeadsKanban` (default view)

Four columns: Neu | Kontaktiert | Konvertiert | Verloren. Each column:
- Header: status label + count badge
- Stack of cards sorted by `created_at DESC`

Each card:
- Member name (bold)
- Source badge: "📸 Instagram" or "🌐 Website"
- Date (`DD. MMM`)
- Email (small, muted)
- Action buttons matching current status:
  - `new` → "Kontaktiert →", "Verloren" (destructive)
  - `contacted` → "Konvertiert →" (success), "Verloren" (destructive)
  - `converted` → none (terminal, green background)
  - `lost` → "Wiederaufnehmen → Neu" (small, muted)

Clicking a status button calls `updateLeadStatus(leadId, newStatus)` with `useTransition` → card animates out of current column on optimistic success, then `revalidatePath('/admin/leads')` places it in the correct column.

### `LeadsListView`

Simple table: Name | Source | Status (dropdown) | Email | Phone | Date | Message.

Status column is a `<select>` — changing value calls `updateLeadStatus`. All data visible at a glance; sortable via server param (`?sort=created_at.desc`).

### Create Lead

"+ NEUER LEAD" opens a slide-over panel with fields: Name, Email, Phone (optional), Message (optional), Source (website/instagram). Calls `createLead(data)` → panel closes → `revalidatePath`.

---

## 7. Member Editing (`/admin/mitglieder` enhanced)

Existing read-only list + filter stays. The row-click handler — currently opening a read-only modal — is replaced with a slide-in `MemberEditPanel` (same pattern as `SessionDetailPanel` from Phase 2a).

### `MemberEditPanel`

**For coaches:** Same read-only detail view as Phase 2a (name, contact, belt history). No form.

**For owners:** Editable form with fields:
- `full_name` (text, required)
- `phone` (text, optional)
- `date_of_birth` (date)
- `role` (select: `member` | `coach`) — owner is not settable from here; `owner` role is preserved if already set but the field is disabled
- Belt history section (read-only) — list of `profile_ranks` for this member

Buttons: "SPEICHERN" (primary) → `updateMember(profileId, data)` → panel closes on success and list refreshes. "ABBRECHEN" closes without saving.

Email is not editable here (tied to Supabase Auth — out of scope).

---

## 8. Settings Page (`/admin/einstellungen`)

Two-column layout. Owner-only (page-level guard + server action guards).

### Left: `ClassTypeTable`

Lists all `class_types` rows. Columns: Name, Level (beginner/all/advanced/kids), Gi/No-Gi, Description (truncated).

Actions per row:
- "Edit" → inline slide-in form with same fields
- "✕" → confirm → `deleteClassType(id)` → row removed

"+ NEU" button top-right → empty form.

Form fields: `name` (text, required), `description` (textarea), `level` (select), `gi` (toggle). Calls `upsertClassType(data)`.

**Guard against deletion:** If a class type is referenced by any `class_sessions`, `deleteClassType` returns an error ("Noch aktive Sessions — zuerst Sessions absagen") and the row stays.

### Right: `RoleManager`

Two sections:

**Coaches (list):** All profiles where `role = 'coach'`. Each row: name + "→ Mitglied" button → confirm → `updateMemberRole(profileId, 'member')`.

**Mitglied → Coach:** Debounced search input (filters on `profiles` where `role = 'member'`) + "→ Coach" button per result → confirm → `updateMemberRole(profileId, 'coach')`.

Server action `updateMemberRole` has an additional safeguard: cannot change own role, cannot set any role to `owner`.

---

## 9. New Server Actions

**`app/actions/promotions.ts`**
- `promoteToNextBelt(profileId: string)` → INSERT into `profile_ranks` with `belt_rank_id` = next rank, `promoted_at` = today, `promoted_by` = current user id. Returns `{ success, newBeltName }` or `{ error }`. Owner-only.

**`app/actions/leads.ts`**
- `updateLeadStatus(leadId, status)` → UPDATE `leads.status`. Coach+owner.
- `createLead(data)` → INSERT `leads`. Coach+owner.

**`app/actions/members.ts`**
- `updateMember(profileId, data)` → UPDATE `profiles` (name, phone, dob). Owner-only.
- `updateMemberRole(profileId, role)` → UPDATE `profiles.role`. Owner-only; cannot modify own profile; role must be `'member'` or `'coach'`.

**`app/actions/class-types.ts`**
- `upsertClassType(data)` → INSERT/UPDATE `class_types`. Owner-only.
- `deleteClassType(id)` → DELETE `class_types` (guarded by FK check for active sessions). Owner-only.

**`app/actions/admin.ts` (extended)**
- `getAdminDashboard()` — extend to include `promotionsReady` and `leadsByStatus` (owner-only sections).

All actions: auth check → role check → operation → `revalidatePath` of the relevant route.

---

## 10. New Components

```
components/admin/
├── PromotionsWidget.tsx      ← Dashboard widget (owner only)
├── LeadsMiniKanban.tsx       ← Dashboard widget (owner only)
├── BeltEligibilityList.tsx   ← /admin/guertel left column
├── PromotionHistory.tsx      ← /admin/guertel right column
├── LeadsKanban.tsx           ← /admin/leads kanban view
├── LeadsListView.tsx         ← /admin/leads list view
├── LeadForm.tsx              ← create-lead slide-over form
├── MemberEditPanel.tsx       ← /admin/mitglieder slide-in (replaces existing read-only modal logic for owner)
├── ClassTypeTable.tsx        ← /admin/einstellungen left column
├── ClassTypeForm.tsx         ← inline/slide-in form used by ClassTypeTable
└── RoleManager.tsx           ← /admin/einstellungen right column
```

All are client components where interactivity is needed (kanban actions, forms, edit panels), server components where not.

---

## 11. i18n

Extend `lib/i18n/de.ts` and `lib/i18n/en.ts` `admin` key with:

```typescript
admin: {
  // ...existing keys from Phase 2a
  guertel: {
    title: 'Gürtelpromotions' | 'Belt Promotions',
    eligible: 'Bereit zu promoten' | 'Ready to promote',
    history: 'Promotions-History' | 'Promotion history',
    promoteBtn: 'Promoten' | 'Promote',
    confirmPromote: '{name} zu {belt} befördern?' | 'Promote {name} to {belt}?',
    noneReady: 'Keine Promotions bereit' | 'No promotions ready',
    sessionsCount: '{n} Sessions',
    monthsInGrade: '{n} Monate',
  },
  leads: {
    title: 'Leads' | 'Leads',
    kanban: 'Kanban' | 'Kanban',
    list: 'Liste' | 'List',
    newLead: 'Neuer Lead' | 'New Lead',
    statusNew: 'Neu' | 'New',
    statusContacted: 'Kontaktiert' | 'Contacted',
    statusConverted: 'Konvertiert' | 'Converted',
    statusLost: 'Verloren' | 'Lost',
    moveToContacted: 'Kontaktiert →' | 'Contacted →',
    moveToConverted: 'Konvertiert →' | 'Converted →',
    moveToLost: 'Verloren' | 'Lost',
    reopen: 'Wiederaufnehmen' | 'Reopen',
    sourceWebsite: 'Website' | 'Website',
    sourceInstagram: 'Instagram' | 'Instagram',
  },
  mitglieder: {
    // ...existing keys
    edit: 'Bearbeiten' | 'Edit',
    save: 'Speichern' | 'Save',
    cancel: 'Abbrechen' | 'Cancel',
    role: 'Rolle' | 'Role',
    phone: 'Telefon' | 'Phone',
    birthDate: 'Geburtsdatum' | 'Date of Birth',
    beltHistory: 'Gürtel-History' | 'Belt history',
  },
  einstellungen: {
    title: 'Einstellungen' | 'Settings',
    classTypes: 'Klassentypen' | 'Class Types',
    newType: 'Neuer Klassentyp' | 'New Class Type',
    deleteConfirm: 'Klassentyp löschen?' | 'Delete class type?',
    deleteBlocked: 'Noch aktive Sessions — zuerst Sessions absagen' | 'Active sessions exist — cancel sessions first',
    roles: 'Rollen & Zugänge' | 'Roles & Access',
    coaches: 'Coaches' | 'Coaches',
    promoteToCoach: '→ Coach' | '→ Coach',
    demoteToMember: '→ Mitglied' | '→ Member',
    searchMember: 'Name suchen ...' | 'Search by name ...',
    level: {
      beginner: 'Anfänger' | 'Beginner',
      all: 'Alle' | 'All Levels',
      advanced: 'Fortgeschritten' | 'Advanced',
      kids: 'Kids' | 'Kids',
    },
    gi: 'Gi',
    noGi: 'No-Gi',
  },
}
```

Existing keys from Phase 2a (`nav`, `dashboard`, `checkin`, `klassen`) stay unchanged.

---

## 12. Database

**No new tables.** All schema already exists:

- `profile_ranks` — INSERT a new row per promotion (`promoted_at`, `promoted_by`). Current belt = most recent row for the profile.
- `leads` — existing, with status enum already including `new|contacted|converted|lost`.
- `class_types` — existing, fully CRUD-able.
- `profiles.role` — existing enum `member|coach|owner`.

**Derived queries:**
- Current belt: `SELECT belt_rank_id FROM profile_ranks WHERE profile_id = ? ORDER BY promoted_at DESC LIMIT 1`
- Months in grade: `EXTRACT(MONTH FROM AGE(NOW(), promoted_at))` on the current rank row
- Attendance count: `SELECT COUNT(*) FROM attendances WHERE profile_id = ?`

---

## 13. Testing

Vitest unit tests for every new server action. Pattern matches Phase 2a tests:
- Auth failure (no user) → `{ error }`
- Role failure (member trying owner action) → `{ error }`
- Happy path → `{ success, ... }`
- DB error → `{ error }`

For `promoteToNextBelt`: also test the "no next belt" case (member already at highest rank) and the "not eligible" case (session/months count below threshold — returns error).

For `updateLeadStatus`: test invalid status → `{ error }`.

For `updateMemberRole`: test the self-change guard and the `role: 'owner'` guard.

For `deleteClassType`: test the FK-in-use guard (should fail when sessions exist).

Component tests not required for Phase 2b (matches Phase 2a pattern — server actions are the testable units).

---

## 14. Out of Scope (Phase 2c or later)

- Drag-and-drop on the leads kanban (status changes happen via button click only)
- Email/SMS notifications (lead status changes, belt promotions)
- Member deactivation (no `active` field in schema; would require migration)
- Editing `profiles.email` (tied to Supabase Auth flow)
- Demoting the owner or changing role to `owner` from the UI (owner role set only by direct DB/seed access)
- Gym-level settings (name, address, contact) — no `app_settings` table exists
- Attendance history view per member
- Revenue/pricing/billing
- Recurring class sessions (templates that auto-generate weekly)

---

## 15. Rollout

1. Merge Phase 2a (PR #6) to `main` first
2. New branch `feature/phase7-admin-full` off `main`
3. Implementation plan will decompose this spec into sequenced tasks (server actions → components → pages → dashboard widgets → nav update)
4. Final PR once all tests pass and spec compliance verified

---
