# Coach Profiles — Public Landing Page

**Date:** 2026-04-21
**Scope:** Dynamic coach profile cards on landing page, managed from the Mitglieder admin panel

---

## Problem

The `CoachCard` component is hardcoded to Shamsudin. Adding or updating coaches requires a code change. There is no admin UI to manage public coach profiles or toggle their visibility.

---

## Approach

Option B (approved): New `coach_profiles` table linked to `profiles` via FK. Separates user account data from public-facing website content. Admin manages coach website profiles inline in the existing `MemberEditPanel`.

---

## Database Schema

### New table: `coach_profiles`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | gen_random_uuid() | |
| `profile_id` | uuid FK → profiles.id | — | UNIQUE |
| `specialization` | text | null | e.g. "Gi & No-Gi · Head Coach" |
| `bio` | text | null | Short public bio |
| `achievements` | text | null | Free text, e.g. "IBJJF European Silver · mehrfacher österreichischer Champion" |
| `show_on_website` | boolean | false | Controls public visibility |
| `display_order` | integer | 99 | Lower = shown first |
| `created_at` | timestamptz | now() | |

**RLS:** Public read access for rows where `show_on_website = true`. Write access for `owner` role only.

**Auto-creation:** When an owner sets a member's role to `coach`, a `coach_profiles` row is upserted (created if missing, no-op if exists). This ensures every coach always has a profile record ready to fill in.

**Seed:** Shamsudin's `coach_profiles` row is created with:
- `display_order = 1`
- `specialization = 'Gi & No-Gi · Head Coach'`
- `bio = 'Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Technik, Disziplin und Respekt — auf und abseits der Matte.'`
- `achievements = 'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver · Mehrfacher österreichischer Champion'`
- `show_on_website = true`

---

## Admin UX

**Location:** `components/admin/MemberEditPanel.tsx`

When the member's role is `coach` or `owner`, a **"Website-Profil"** section appears below existing fields:

```
─── WEBSITE-PROFIL ───────────────────────────
[ ✓ ] Auf Landing Page anzeigen

Spezialisierung
[ Gi & No-Gi · Head Coach                    ]

Bio
[ Textarea — short public description         ]

Erfolge
[ Free text — one achievement per line or     ]
[ comma-separated                             ]

                              [ Speichern ]
```

**Save action:** `upsertCoachProfile({ profileId, specialization, bio, achievements, showOnWebsite })` — inserts on first save, updates on subsequent saves. Returns the updated record.

**Loading:** When the panel opens for a coach, the existing `coach_profiles` row (if any) is fetched and pre-fills the form.

---

## Landing Page

### Data flow

```
CoachSection (server component)
  └─ getPublicCoaches() → coach_profiles JOIN profiles JOIN profile_ranks JOIN belt_ranks
       WHERE show_on_website = true
       ORDER BY display_order ASC
  └─ CoachSlider (client component)
       └─ CoachProfileCard (pure display, repeated per coach)
```

### `getPublicCoaches()` — `app/actions/public-coaches.ts`

Returns `CoachPublicProfile[]`:
```ts
interface CoachPublicProfile {
  profileId: string
  name: string
  avatarUrl: string | null
  specialization: string | null
  bio: string | null
  achievements: string | null
  beltName: string | null        // current belt (from profile_ranks → belt_ranks)
  beltColorHex: string | null
  displayOrder: number
}
```

### `CoachSlider` — `components/public/CoachSlider.tsx`

Client component. Receives `coaches: CoachPublicProfile[]`.

- **1 coach:** Renders the card directly with no navigation controls.
- **2+ coaches:** Renders with prev/next arrow buttons and dot indicators. Swipeable on mobile (touch events).
- Active coach index tracked in `useState`.

### `CoachProfileCard` — `components/ui/coach-profile-card.tsx`

Pure display component. Renders:
- Photo (Next.js `<Image>`, fallback to `/images/coach-portrait.jpg`)
- Specialization badge (primary color, uppercase, tracking)
- Name (large, font-black)
- Belt progression bar (White → Blue → Purple → Brown → Black, active belt highlighted)
- Bio text (muted-foreground)
- Achievements (italic, primary/80)

Replaces the hardcoded `CoachCard` component. `CoachCard` is kept as-is to avoid breaking the existing `CoachSection.test.tsx` — the test file will be updated as part of this task to use the new data-driven components.

### `CoachSection` update — `components/public/CoachSection.tsx`

Becomes `async`. Calls `getPublicCoaches()` and passes result to `<CoachSlider>`. If no coaches returned, renders nothing (no broken empty section).

---

## Component Changes

| File | Change |
|------|--------|
| `supabase/migrations/20260421_coach_profiles.sql` | Create `coach_profiles` table, RLS, seed Shamsudin |
| `app/actions/public-coaches.ts` | New: `getPublicCoaches()` |
| `app/actions/coach-profile-admin.ts` | New: `upsertCoachProfile()`, `getCoachProfile(profileId)` |
| `app/actions/__tests__/coach-profile-admin.test.ts` | New: tests for upsert and fetch |
| `components/ui/coach-profile-card.tsx` | New: data-driven card replacing hardcoded CoachCard |
| `components/public/CoachSlider.tsx` | New: client slider wrapper |
| `components/public/CoachSection.tsx` | Modify: async, call getPublicCoaches, render CoachSlider |
| `components/admin/MemberEditPanel.tsx` | Modify: add Website-Profil section for coaches; call `upsertCoachProfile` on role change to 'coach' to auto-create the profile row |
| `components/public/__tests__/CoachSection.test.tsx` | Modify: update to mock `getPublicCoaches()` instead of the hardcoded component |

---

## Out of Scope

- Member achievement spotlights (separate spec)
- Coach-specific pages or detail routes
- Uploading coach photos via admin (uses existing `avatar_url` from profiles)
- Drag-to-reorder for `display_order` (owner sets order number manually)
