# Tournament System

**Date:** 2026-04-21
**Scope:** Coach-managed tournament calendar, member registration with coach approval, public landing page section

---

## Problem

No tournament management exists. Coaches manually communicate about tournaments outside the app. Members have no central place to see and sign up for upcoming events. The landing page shows no upcoming competitions.

---

## Approach

Option A (approved): New dedicated `tournaments` + `tournament_registrations` tables. Dedicated `/admin/turniere` page for coaches and owners. New member page at `/dashboard/turniere`. Public landing page section. Owner must approve coach-created tournaments before they're visible.

---

## Database Schema

### `tournaments`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | gen_random_uuid() | |
| `name` | text NOT NULL | — | |
| `date` | date NOT NULL | — | Start date |
| `end_date` | date | null | Optional, multi-day |
| `location` | text NOT NULL | — | |
| `type` | `'internal' \| 'external'` NOT NULL | `'external'` | |
| `description` | text | null | |
| `registration_deadline` | date | null | |
| `coach_id` | uuid FK → profiles | null | Creator |
| `status` | `'pending_approval' \| 'approved' \| 'cancelled'` NOT NULL | `'pending_approval'` | |
| `created_at` | timestamptz NOT NULL | now() | |

**RLS:**
- Public (anon + authenticated): SELECT WHERE `status = 'approved' AND date >= CURRENT_DATE`
- Coaches: SELECT all, INSERT (own), UPDATE own WHERE `status = 'pending_approval'`
- Owners: SELECT all, INSERT (goes straight to `approved`), UPDATE all, DELETE

**Owner auto-approve rule:** When owner calls `createTournament`, the server action sets `status = 'approved'` in the insert payload. No DB trigger needed.

### `tournament_registrations`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | gen_random_uuid() | |
| `tournament_id` | uuid FK → tournaments ON DELETE CASCADE | — | |
| `profile_id` | uuid FK → profiles ON DELETE CASCADE | — | |
| `weight_category` | text | null | e.g. "-70kg" |
| `gi_nogi` | `'gi' \| 'nogi' \| 'both'` | null | |
| `notes` | text | null | |
| `status` | `'pending' \| 'approved' \| 'denied'` NOT NULL | `'pending'` | |
| `created_at` | timestamptz NOT NULL | now() | |
| UNIQUE | (tournament_id, profile_id) | | One registration per member |

**RLS:**
- Members: SELECT own registrations, INSERT own (when tournament is approved + deadline not passed), UPDATE own pending (to cancel/edit before deadline)
- Coaches: SELECT all registrations for tournaments they coach or all, UPDATE status field
- Owners: Full access

---

## Navigation Changes

### Admin sidebar (desktop) — add under OPS section for both roles:

```
─── OPS ──────────────────────
  Dashboard
  Check-In
  Training
  Turniere          ← NEW
```

### Admin mobile bottom bar — add to coach tabs (replace Schüler with Turniere for coaches, or add to owner Mehr sheet):

**Coach bottom tabs (5 → keep 4, swap Schüler for Turniere in tab 4):**
No — keep Schüler. Add Turniere to owner Mehr sheet only (coaches access via sidebar on desktop, or via Mehr equivalent).

**Simpler approach:** Add `Turniere` to the sidebar OPS section only. Mobile: coaches access via the existing sidebar-equivalent (hamburger was replaced with bottom bar but we have a "Mehr" concept). Add Turniere to the coach bottom bar as 5th item replacing nothing — but 5 tabs may be too many on small screens.

**Final decision:**
- Coach bottom bar: replace "Schüler" (4th tab) with "Turniere". `/admin/mitglieder` still accessible via desktop sidebar.
- Owner bottom bar: add "Turniere" to the "Mehr" sheet (owner already has 4 primary tabs + Mehr).

### Member area nav — add Turniere link to member sidebar/nav.

---

## Admin Page: `/admin/turniere`

### Coach view

**List section:**
- Table/list of tournaments this coach created
- Columns: Name, Datum, Ort, Typ, Status badge, Aktionen
- Status badges: `Ausstehend` (yellow), `Genehmigt` (green), `Abgesagt` (grey)
- Actions: Edit (only pending), View Registrations (only approved), Cancel

**Create/Edit side panel (same pattern as ClassTypeForm):**
- Name (text, required)
- Datum (date, required)
- End-Datum (date, optional)
- Ort (text, required)
- Typ: Intern / Extern (radio/select)
- Beschreibung (textarea)
- Anmeldeschluss (date, optional)
- Submit → creates with `status = 'pending_approval'`

**Registration review panel:**
- Opens when clicking "Anmeldungen" on an approved tournament
- Lists all registrations with: member name, weight category, gi/nogi, notes, status
- Per registration: Approve / Deny buttons

### Owner view (extends coach view)

- Sees ALL tournaments from all coaches + their own
- Extra action on `pending_approval` entries: **Genehmigen** ✓ and **Ablehnen** ✗ buttons
- Owner-created tournaments are saved with `status = 'approved'` directly
- Can edit or cancel any tournament

---

## Member Page: `/dashboard/turniere`

**URL:** `/dashboard/turniere` (new page in member area)

**Layout:**
- List of approved upcoming tournaments (date >= today)
- Each card: name, date (formatted), location, type badge, description, registration deadline
- Registration status badge if member already registered: `Ausstehend` / `Bestätigt ✓` / `Abgelehnt`
- "Anmelden" button (hidden if already registered or deadline passed)

**Registration inline form (expands on card):**
- Gewichtsklasse (text input, placeholder "-70kg")
- Gi / No-Gi / Beides (radio buttons)
- Notizen (textarea, optional)
- Submit → creates registration with `status = 'pending'`

---

## Landing Page Section

**New component:** `TournamentSection` added to the public homepage after CoachSection.

**Layout:**
```
TURNIERE · UPCOMING
[Tournament card]
  Name · Date · Location · Intern/Extern
  [Participant avatar] [avatar] [avatar]  "3 bestätigt"
```

- Shows max 4 approved tournaments with `date >= today`, ordered by date ASC
- Each shows a horizontal scroll of approved participants (avatar + first name, no surname)
- If 0 approved participants: no participant row
- Returns null (hides section) if no upcoming approved tournaments

**Data action:** `getPublicTournaments()` in `app/actions/public-tournaments.ts`
Returns `TournamentPublic[]`:
```ts
interface TournamentPublic {
  id: string
  name: string
  date: string
  endDate: string | null
  location: string
  type: 'internal' | 'external'
  description: string | null
  approvedParticipants: { name: string; avatarUrl: string | null }[]
}
```

---

## New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260421_tournaments.sql` | Tables, enums, RLS |
| `app/actions/tournaments.ts` | `createTournament`, `updateTournament`, `approveTournament`, `cancelTournament` |
| `app/actions/tournament-registrations.ts` | `registerForTournament`, `updateRegistrationStatus`, `getMyRegistrations` |
| `app/actions/public-tournaments.ts` | `getPublicTournaments` |
| `app/actions/__tests__/tournaments.test.ts` | Tests for tournament actions |
| `app/actions/__tests__/tournament-registrations.test.ts` | Tests for registration actions |
| `app/(admin)/admin/turniere/page.tsx` | Admin tournament management page |
| `components/admin/TournamentForm.tsx` | Create/edit side panel |
| `components/admin/TournamentList.tsx` | Tournament list with actions |
| `components/admin/RegistrationReviewPanel.tsx` | Coach registration approval UI |
| `app/(members)/dashboard/turniere/page.tsx` | Member tournament list + registration |
| `components/public/TournamentSection.tsx` | Landing page public section |
| `components/public/TournamentCard.tsx` | Individual tournament display card |
| `components/admin/AdminNav.tsx` | Add Turniere to OPS section |
| `app/layout.tsx` (public page) | Add TournamentSection |

---

## Out of Scope

- Email/push notifications for tournament approval or registration status changes
- Tournament brackets or results tracking (that's post-event, use existing competitions table)
- File/PDF attachments for tournament info
- Waiting list for tournaments at capacity
