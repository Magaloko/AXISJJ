# Training Tracker — Design Spec
**Date:** 2026-04-20  
**Project:** AXISJJ  
**Status:** Approved

---

## Overview

A member-facing training tracker that lets gym members log each session with mood, energy, self-assessment, and goals. Triggered automatically after admin check-in and available manually at any time. Data surfaces in the member dashboard as charts and motivational widgets.

---

## 1. Database Schema

### New table: `training_logs`

```sql
CREATE TABLE training_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  mood_before  INT NOT NULL CHECK (mood_before BETWEEN 1 AND 5),
  mood_after   INT CHECK (mood_after BETWEEN 1 AND 5),
  energy       INT CHECK (energy BETWEEN 1 AND 5),
  technique    INT CHECK (technique BETWEEN 1 AND 5),
  conditioning INT CHECK (conditioning BETWEEN 1 AND 5),
  mental       INT CHECK (mental BETWEEN 1 AND 5),
  focus_areas  TEXT[] NOT NULL DEFAULT '{}',
  notes        TEXT,
  next_goal    TEXT,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RLS Policies
- Member: SELECT/INSERT/UPDATE own rows (`profile_id = auth.uid()`)
- Coach/Owner: SELECT all rows

### Supabase types update
Add `training_logs` to `types/supabase.ts` with proper Insert/Update/Row types.

---

## 2. Backend

### Server Action: `app/actions/training-log.ts`

**`logTraining(data: TrainingLogInput)`**
- Validates with Zod schema
- Inserts into `training_logs`
- Returns `{ success: true, id }` or `{ error: string }`

**`getTrainingStats(profileId: string)`**
- Returns:
  - `totalSessions`: count of all logs
  - `currentStreak`: consecutive days with training (within 7-day window)
  - `avgMoodLift`: average of (mood_after - mood_before) across all logs
  - `lastSession`: most recent `logged_at`
  - `weeklyFrequency`: array of 12 objects `{ week: string, count: number }`
  - `moodTrend`: array of last 20 logs `{ date, mood_before, mood_after }`
  - `radarAvg`: `{ technique, conditioning, mental }` averaged over last 30 days
  - `lastGoal`: `next_goal` from most recent log

### Zod Schema: `app/actions/training-log.schema.ts`
```typescript
z.object({
  session_id:   z.string().uuid().optional().nullable(),
  mood_before:  z.number().int().min(1).max(5),
  mood_after:   z.number().int().min(1).max(5).optional(),
  energy:       z.number().int().min(1).max(5).optional(),
  technique:    z.number().int().min(1).max(5).optional(),
  conditioning: z.number().int().min(1).max(5).optional(),
  mental:       z.number().int().min(1).max(5).optional(),
  focus_areas:  z.array(z.string()).default([]),
  notes:        z.string().max(1000).optional(),
  next_goal:    z.string().max(500).optional(),
})
```

---

## 3. UI Components

### `TrainingLogDrawer` (client component)
- Slide-in drawer from the right
- Steps:
  1. **Stimmung vorher** — emoji scale 1–5 (😞 😕 😐 🙂 😊)
  2. **Stimmung nachher** — same scale
  3. **Energie** — 1–5 stars/lightning icons
  4. **Fokus-Bereiche** — tag chips: Guard, Passing, Takedowns, No-Gi, Kondition, Sparring, Technik
  5. **Selbstbewertung** — 3 sliders: Technik / Kondition / Mental (1–5)
  6. **Notizen** — textarea
  7. **Ziel nächste Session** — short text input
- Submit calls `logTraining`
- Cancel closes without saving

### `TrainingLogBanner` (client component)
- Appears in member dashboard when a new attendance exists without a training_log
- "Du warst heute im Training! Wie war es?" + "Jetzt loggen" button
- Dismissable (localStorage flag per session_id)

### Dashboard Stats Cards (in `app/(members)/dashboard/page.tsx`)
- Card row: Total Trainings · 🔥 Streak · Ø Stimmung · Letzte Session
- Using existing `Card`/`CardContent` from `components/ui/card.tsx`

### `TrainingFrequencyChart` (client, Recharts BarChart)
- Last 12 weeks, bars = session count per week
- Colors: primary red for current week, muted for past

### `MoodTrendChart` (client, Recharts LineChart)
- Two lines: mood_before (muted) and mood_after (primary)
- X-axis: date of last 20 sessions
- Shows mood improvement from training

### `SkillRadarChart` (client, Recharts RadarChart)
- 3 axes: Technik / Kondition / Mental
- Single area fill from last 30 days average
- Fills in as member logs more sessions

### `MotivationWidget`
- Streak ≥ 3: "🔥 {n} Sessions in Folge — bleib dran!"
- Last session > 7 days ago: "Komm zurück — letztes Training vor {n} Tagen"
- Shows `next_goal` from last log if present
- No data yet: "Starte deinen ersten Training-Log!"

---

## 4. Trigger Integration

### Automatic (post check-in)
- `app/(members)/dashboard/page.tsx` queries: does a `training_logs` row exist for the most recent `attendance` record?
- If not: render `TrainingLogBanner` with that `session_id` pre-filled

### Manual
- "Training loggen" button always visible in dashboard
- Opens `TrainingLogDrawer` with `session_id = null`

---

## 5. Member Dashboard Layout (updated)

```
[Banner: Log dein heutiges Training?]        ← conditional

[Stats Row]
[Total: 47] [Streak: 🔥 5] [Ø +0.8↑] [Letzte: Mo 18:00]

[Frequency Chart]        [Mood Trend Chart]

[Radar Chart]            [Motivation Widget]

[BeltProgress]           [NextClassCard]

[MemberQRCode]           [OpeningHoursWidget]
```

---

## 6. Files to Create / Modify

| File | Action |
|------|--------|
| `supabase/migrations/20260420_training_logs.sql` | New |
| `types/supabase.ts` | Add training_logs types |
| `app/actions/training-log.schema.ts` | New |
| `app/actions/training-log.ts` | New |
| `components/members/TrainingLogDrawer.tsx` | New |
| `components/members/TrainingLogBanner.tsx` | New |
| `components/members/TrainingFrequencyChart.tsx` | New |
| `components/members/MoodTrendChart.tsx` | New |
| `components/members/SkillRadarChart.tsx` | New |
| `components/members/MotivationWidget.tsx` | New |
| `app/(members)/dashboard/page.tsx` | Modify |

---

## 7. Dependencies

```bash
npm install recharts
```

Recharts is tree-shakeable; only imported chart types are bundled.
