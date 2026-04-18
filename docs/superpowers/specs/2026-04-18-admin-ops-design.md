# AXISJJ Admin Ops — Design Spec (Phase 2a)

**Date:** 2026-04-18
**Scope:** Admin section for coaches and owners — layout, dashboard, check-in, classes management, members read-only list. Role management, belt promotions, and leads pipeline are Phase 2b.

---

## 1. Goals

Give coaches a focused operational admin (check-in, classes, member lookup) and give the owner everything coaches have plus management tools (added in 2b). Both roles share the same URL structure and visual design — role determines what's visible, not which URL they visit.

---

## 2. Roles & Access

Three roles exist in `profiles.role`: `member`, `coach`, `owner`.

| Feature | member | coach | owner |
|---|---|---|---|
| `/admin/*` routes | ✗ blocked by middleware | ✓ | ✓ |
| Dashboard | — | Today's ops view | Full stats + promotions widget |
| Check-in | — | ✓ full | ✓ full |
| Classes (CRUD) | — | ✓ full | ✓ full |
| Members (list) | — | ✓ read-only | ✓ read-only (edit in 2b) |
| Member role mgmt | — | ✗ | ✓ (in 2b) |
| Belt promotions | — | ✗ | ✓ (in 2b) |
| Leads pipeline | — | ✗ | ✓ (in 2b) |

Middleware at `middleware.ts` already enforces the `/admin` guard: requires `role IN ('coach', 'owner')`. No changes needed there.

---

## 3. Architecture

### Route Group

```
app/
└── (admin)/
    ├── layout.tsx          ← fetches user + role, renders AdminNav
    ├── dashboard/page.tsx
    ├── checkin/page.tsx
    ├── klassen/page.tsx
    └── mitglieder/page.tsx
```

Routes resolve without the group name: `/admin/dashboard`, `/admin/checkin`, `/admin/klassen`, `/admin/mitglieder`.

### Layout

`app/(admin)/layout.tsx` is a server component that:
1. Calls `createClient()` → `supabase.auth.getUser()`
2. Fetches `profiles.role` + `profiles.full_name` for the authenticated user
3. Renders `<AdminNav role={role} userName={displayName} />` + `{children}`

The layout wraps everything in `min-h-screen bg-background`. Main content offset: `lg:ml-60` (sidebar width 240px).

### AdminNav Component

`components/admin/AdminNav.tsx` — client component, same structure as `MemberNav`:
- Fixed left sidebar (240px) on desktop, slide-in drawer on mobile (hamburger in top bar)
- Role-aware nav items:

**Coach nav (4 items):**
```
📊 Dashboard      /admin/dashboard
✅ Check-In       /admin/checkin
📅 Klassen        /admin/klassen
👥 Mitglieder     /admin/mitglieder
```

**Owner nav (7 items, two groups):**
```
── OPS ──
📊 Dashboard      /admin/dashboard
✅ Check-In       /admin/checkin
📅 Klassen        /admin/klassen
── MANAGEMENT ──
👥 Mitglieder     /admin/mitglieder
🥋 Gürtel         /admin/guertel      (Phase 2b)
📋 Leads          /admin/leads        (Phase 2b)
⚙️  Einstellungen  /admin/einstellungen (Phase 2b)
```

Phase 2b nav items are rendered but marked "Bald verfügbar" and non-clickable in Phase 2a — so the owner sees the full nav structure immediately without dead links.

Active state: `bg-primary/10 text-primary` (same token as MemberNav). Role badge in sidebar header: "AXIS Coach" or "AXIS Owner" in `text-primary`.

---

## 4. Dashboard Page (`/admin/dashboard`)

### Coach View

Parallel data fetches:
- Today's sessions: `class_sessions` where `starts_at::date = today` and `cancelled = false`
- Today's check-in count: `attendances` where `checked_in_at::date = today`
- Upcoming session: next session starting after `now()`

Renders:
- Stat row: `Check-Ins heute` (mono number), `Buchungen heute` (mono number)
- Upcoming class card: name, time, capacity bar (`confirmed / capacity`)
- Full today's schedule: list of sessions with time + booking count

### Owner View

All of the above, plus parallel fetches for:
- Active member count: `profiles` where `role = 'member'`
- New leads this week: `leads` where `created_at > now() - 7 days` and `status = 'new'`
- Promotion-ready members: query `profile_ranks` joined with `belt_ranks` — members where `attendances.count >= belt_ranks.min_sessions` AND `months_in_grade >= belt_ranks.min_time_months`

Owner dashboard adds:
- Extended stat row: `Mitglieder`, `Neue Leads`, `Check-Ins heute`
- "Promotions bereit" card: read-only list of eligible members with their current belt and next belt name. No action button in Phase 2a — clicking a row links to `/admin/guertel` (disabled stub). The full promote action ships in Phase 2b.

---

## 5. Check-In Page (`/admin/checkin`)

### Session Selector

Dropdown at top of page: today's non-cancelled sessions sorted by `starts_at`. Selecting a session loads its booking list. Default: the session starting soonest after `now()` (or the last one of the day if all have passed).

State: `selectedSessionId` in URL search param (`?session=<id>`) so the page is shareable and survives refresh.

### QR Scanner

Uses the browser camera via `getUserMedia({ video: { facingMode: 'environment' } })` — rear camera on phones/tablets. Frames are decoded using the `jsQR` npm package (scans canvas frames at ~10fps via `requestAnimationFrame`).

**QR code format:** The member's `profile_id` (UUID) encoded as a plain string. No JWT, no expiry — the check-in action validates the UUID exists in `profiles`.

**Member QR code** (new component in member portal): `components/members/MemberQRCode.tsx` uses the `qrcode` npm package to render the member's `profile_id` as a QR image. Added to the member dashboard page below the BeltProgress card.

**On successful scan:**
1. Call `checkIn(profileId, sessionId)` server action
2. Server action: inserts into `attendances` (profile_id, session_id, checked_in_at) — upsert to avoid duplicate on double-scan
3. Returns `{ success: true, memberName: string }` or `{ error: string }`
4. UI: green flash overlay with member name for 2 seconds, then resume scanning

**On unknown QR / not booked:** Red flash with error message. Resume scanning.

### Manual List

Below the camera viewport: all `bookings` for the selected session where `status = 'confirmed'`, joined with `profiles.full_name`. Sorted: not-checked-in first, then checked-in (green).

Each row: member name + check-in button. Tap → calls same `checkIn` server action → row turns green instantly (optimistic update). Already-checked-in rows show timestamp in mono font.

Counter above the list: `12 / 18 eingecheckt` updates in real time (client state).

---

## 6. Classes Page (`/admin/klassen`)

### Weekly Calendar View

7-column grid (Mon–Sun), current week shown by default. Prev/Next week navigation (updates URL param `?week=2026-W16`).

Each session renders as a colored block in the correct day column, positioned by start time (not pixel-accurate — just stacked in order within the day). Block shows: class type name, start time, `confirmed/capacity`. Full sessions show in amber, cancelled sessions are struck through and greyed.

Click a session → **detail panel** slides in from the right (fixed panel, not modal):
- Class type, date, time range, location
- Capacity: `confirmed bookings / max`  
- Booking list: member names with status
- Actions: **Bearbeiten** (opens edit form) | **Absagen** (confirm → sets `cancelled = true`, sends no notification in Phase 2a)

### Create / Edit Form

Slide-over panel (same pattern as detail panel, replaces it):

Fields:
- Class type: dropdown from `class_types` table
- Datum: date picker
- Startzeit / Endzeit: time inputs
- Kapazität: number input (min 1, max 99)
- Ort: text input (default: "AXIS Gym")

Server action `upsertSession(data)`: inserts or updates `class_sessions`. Returns new session or validation error.

"Neue Session" button: top-right of the page. Opens create form with today's date pre-filled.

---

## 7. Members Page (`/admin/mitglieder`)

### Coach View (read-only)

Searchable, filterable list of all `profiles` where `role = 'member'`.

Columns: Name, Belt (color swatch + name), Stripes, Member since, Last attendance date.

Filters:
- Search: debounced name search (client-side filter on loaded data — no server round-trip for <200 members)
- Belt filter: dropdown (all belts from `belt_ranks` table)

No edit actions. No role assignment. Clicking a row shows a read-only member detail panel (name, contact, belt history).

### Owner View (Phase 2a)

Same as coach view — edit/role assignment actions are added in Phase 2b. The owner sees the same read-only list in Phase 2a, with the understanding that management actions follow immediately in 2b.

---

## 8. New Server Actions

**`app/actions/checkin.ts`**
- `checkIn(profileId: string, sessionId: string)` → upsert `attendances`, return member name

**`app/actions/sessions.ts`**
- `upsertSession(data: SessionFormData)` → insert or update `class_sessions`
- `cancelSession(sessionId: string)` → set `cancelled = true`

**`app/actions/admin.ts`**
- `getAdminDashboard()` → parallel fetch of today's stats
- `getTodaySessions()` → sessions for check-in selector
- `getSessionBookings(sessionId: string)` → bookings + check-in status for manual list

---

## 9. New Components

```
components/admin/
├── AdminNav.tsx           ← role-aware sidebar + mobile drawer
├── AdminStatCard.tsx      ← reusable stat tile (label + mono number)
├── SessionCalendar.tsx    ← 7-column week grid
├── SessionDetailPanel.tsx ← slide-in detail/edit panel
├── SessionForm.tsx        ← create/edit form (used inside panel)
├── CheckInScanner.tsx     ← camera + jsQR client component
├── CheckInList.tsx        ← manual booking list with optimistic check-in
└── MemberTable.tsx        ← searchable/filterable member list

components/members/
└── MemberQRCode.tsx       ← QR code display for member dashboard
```

---

## 10. i18n

Add `admin` key to both `lib/i18n/de.ts` and `lib/i18n/en.ts`:

```typescript
admin: {
  nav: {
    dashboard: 'Dashboard' | 'Dashboard',
    checkin: 'Check-In' | 'Check-In',
    klassen: 'Klassen' | 'Classes',
    mitglieder: 'Mitglieder' | 'Members',
    guertel: 'Gürtel' | 'Belt Ranks',
    leads: 'Leads' | 'Leads',
  },
  dashboard: {
    title: 'Dashboard' | 'Dashboard',
    checkinsToday: 'Check-Ins heute' | 'Check-ins today',
    bookingsToday: 'Buchungen heute' | 'Bookings today',
    activeMembers: 'Mitglieder' | 'Members',
    newLeads: 'Neue Leads' | 'New Leads',
    promotionsReady: 'Promotions bereit' | 'Ready to promote',
  },
  checkin: {
    title: 'Check-In' | 'Check-In',
    selectSession: 'Session wählen' | 'Select session',
    scanning: 'QR-Code scannen' | 'Scan QR code',
    checkedIn: 'eingecheckt' | 'checked in',
    checkInBtn: 'Einchecken' | 'Check in',
    alreadyCheckedIn: 'Bereits eingecheckt' | 'Already checked in',
    notBooked: 'Nicht gebucht' | 'Not booked',
  },
  klassen: {
    title: 'Klassen' | 'Classes',
    newSession: 'Neue Session' | 'New Session',
    editSession: 'Session bearbeiten' | 'Edit Session',
    cancelSession: 'Absagen' | 'Cancel',
    cancelConfirm: 'Session wirklich absagen?' | 'Really cancel this session?',
    capacity: 'Kapazität' | 'Capacity',
    location: 'Ort' | 'Location',
  },
  mitglieder: {
    title: 'Mitglieder' | 'Members',
    searchPlaceholder: 'Name suchen ...' | 'Search by name ...',
    filterBelt: 'Gürtel filtern' | 'Filter by belt',
    memberSince: 'Mitglied seit' | 'Member since',
    lastAttendance: 'Letztes Training' | 'Last training',
  },
}
```

---

## 11. npm Packages Required

- `jsqr` — QR code decoding from canvas frames (pure JS, no native deps)
- `qrcode` — Generate QR code PNG/SVG for member portal

---

## 12. Out of Scope (Phase 2b)

- Role assignment (promote member → coach)
- Full member edit (profile, belt, documents)
- Belt promotion engine (eligibility list + one-click promote)
- Leads pipeline (New → Contacted → Converted kanban)
- Admin settings page
- Email/push notifications on session cancellation
