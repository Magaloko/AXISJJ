# Training Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a member training tracker with mood/energy/self-assessment logging, auto-triggered after check-in, with dashboard charts (frequency, mood trend, skill radar) and motivation widget.

**Architecture:** New `training_logs` Supabase table stores per-session data. Server actions handle write + stats aggregation. Client components (Recharts) render charts. Member dashboard page updated to fetch stats and show all widgets.

**Tech Stack:** Next.js 16 App Router · Supabase · Zod · Recharts · TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260420_training_logs.sql` | Create | DB table + RLS + index |
| `types/supabase.ts` | Modify | Add training_logs Row/Insert/Update |
| `app/actions/training-log.schema.ts` | Create | Zod validation schema |
| `app/actions/training-log.ts` | Create | `logTraining` + `getTrainingStats` actions |
| `app/actions/__tests__/training-log.test.ts` | Create | Unit tests for stats logic |
| `components/members/TrainingLogDrawer.tsx` | Create | Multi-step log form (drawer) |
| `components/members/TrainingLogBanner.tsx` | Create | Post-check-in prompt banner |
| `components/members/TrainingFrequencyChart.tsx` | Create | Recharts BarChart — weekly count |
| `components/members/MoodTrendChart.tsx` | Create | Recharts LineChart — mood before/after |
| `components/members/SkillRadarChart.tsx` | Create | Recharts RadarChart — tech/cond/mental |
| `components/members/MotivationWidget.tsx` | Create | Streak message + last goal display |
| `app/(members)/dashboard/page.tsx` | Modify | Add stats fetch + all new widgets |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260420_training_logs.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/20260420_training_logs.sql
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

ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_logs_own_all"
  ON training_logs FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "training_logs_coach_read"
  ON training_logs FOR SELECT
  USING (get_my_role() IN ('coach', 'owner'));

CREATE INDEX idx_training_logs_profile_logged
  ON training_logs(profile_id, logged_at DESC);
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Paste the migration into the Supabase Dashboard → SQL Editor and click Run.
Expected: no errors, table `training_logs` visible in Table Editor.

- [ ] **Step 3: Update `types/supabase.ts` — add training_logs**

In `types/supabase.ts`, inside `Tables: {` add after the last table:

```typescript
      training_logs: {
        Row: {
          id: string
          profile_id: string
          session_id: string | null
          mood_before: number
          mood_after: number | null
          energy: number | null
          technique: number | null
          conditioning: number | null
          mental: number | null
          focus_areas: string[]
          notes: string | null
          next_goal: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          session_id?: string | null
          mood_before: number
          mood_after?: number | null
          energy?: number | null
          technique?: number | null
          conditioning?: number | null
          mental?: number | null
          focus_areas?: string[]
          notes?: string | null
          next_goal?: string | null
          logged_at?: string
        }
        Update: Partial<Database['public']['Tables']['training_logs']['Insert']>
        Relationships: []
      }
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260420_training_logs.sql types/supabase.ts
git commit -m "feat: add training_logs table with RLS and types"
```

---

## Task 2: Zod Schema + Server Actions

**Files:**
- Create: `app/actions/training-log.schema.ts`
- Create: `app/actions/training-log.ts`

- [ ] **Step 1: Create Zod schema**

```typescript
// app/actions/training-log.schema.ts
import { z } from 'zod'

export const trainingLogSchema = z.object({
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

export type TrainingLogInput = z.infer<typeof trainingLogSchema>
```

- [ ] **Step 2: Create server action file**

```typescript
// app/actions/training-log.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { trainingLogSchema, type TrainingLogInput } from './training-log.schema'

export async function logTraining(
  data: TrainingLogInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = trainingLogSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: log, error } = await supabase
    .from('training_logs')
    .insert({
      profile_id:   user.id,
      session_id:   parsed.data.session_id ?? null,
      mood_before:  parsed.data.mood_before,
      mood_after:   parsed.data.mood_after ?? null,
      energy:       parsed.data.energy ?? null,
      technique:    parsed.data.technique ?? null,
      conditioning: parsed.data.conditioning ?? null,
      mental:       parsed.data.mental ?? null,
      focus_areas:  parsed.data.focus_areas,
      notes:        parsed.data.notes ?? null,
      next_goal:    parsed.data.next_goal ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/dashboard')
  return { success: true, id: log.id }
}

export interface TrainingStats {
  totalSessions: number
  currentStreak: number
  avgMoodLift: number | null
  lastSessionDate: string | null
  weeklyFrequency: { week: string; count: number }[]
  moodTrend: { date: string; mood_before: number; mood_after: number | null }[]
  radarAvg: { technique: number; conditioning: number; mental: number } | null
  lastGoal: string | null
}

export async function getTrainingStats(): Promise<TrainingStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const empty: TrainingStats = {
    totalSessions: 0, currentStreak: 0, avgMoodLift: null,
    lastSessionDate: null, weeklyFrequency: [], moodTrend: [],
    radarAvg: null, lastGoal: null,
  }
  if (!user) return empty

  const { data: logs } = await supabase
    .from('training_logs')
    .select('id, logged_at, mood_before, mood_after, technique, conditioning, mental, next_goal')
    .eq('profile_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(100)

  if (!logs || logs.length === 0) return empty

  return computeStats(logs)
}

// Exported for unit testing
export function computeStats(logs: {
  logged_at: string
  mood_before: number
  mood_after: number | null
  technique: number | null
  conditioning: number | null
  mental: number | null
  next_goal: string | null
}[]): TrainingStats {
  const totalSessions = logs.length
  const lastSessionDate = logs[0].logged_at
  const lastGoal = logs.find(l => l.next_goal)?.next_goal ?? null

  // Streak: consecutive calendar days from today backward
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const seenDays = new Set(logs.map(l => {
    const d = new Date(l.logged_at)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }))
  let streak = 0
  const check = new Date(today)
  while (seenDays.has(check.getTime())) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  // Avg mood lift
  const withAfter = logs.filter(l => l.mood_after !== null)
  const avgMoodLift = withAfter.length > 0
    ? Math.round((withAfter.reduce((a, l) => a + (l.mood_after! - l.mood_before), 0) / withAfter.length) * 10) / 10
    : null

  // Weekly frequency — 12 buckets, Mon-anchored
  const weekBuckets: Map<string, number> = new Map()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today)
    const dow = (d.getDay() + 6) % 7 // Mon = 0
    d.setDate(d.getDate() - dow - i * 7)
    weekBuckets.set(d.toISOString().split('T')[0], 0)
  }
  for (const log of logs) {
    const d = new Date(log.logged_at)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().split('T')[0]
    if (weekBuckets.has(key)) weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1)
  }
  const weeklyFrequency = Array.from(weekBuckets.entries()).map(([week, count]) => ({ week, count }))

  // Mood trend — last 20 logs, ascending
  const moodTrend = logs.slice(0, 20).map(l => ({
    date: l.logged_at.split('T')[0],
    mood_before: l.mood_before,
    mood_after: l.mood_after,
  })).reverse()

  // Radar avg — last 30 days
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - 30)
  const recent = logs.filter(l => new Date(l.logged_at) >= cutoff)
  const withScores = recent.filter(l => l.technique || l.conditioning || l.mental)
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
  const radarAvg = withScores.length > 0 ? {
    technique:    avg(withScores.map(l => l.technique ?? 0).filter(Boolean)),
    conditioning: avg(withScores.map(l => l.conditioning ?? 0).filter(Boolean)),
    mental:       avg(withScores.map(l => l.mental ?? 0).filter(Boolean)),
  } : null

  return { totalSessions, currentStreak: streak, avgMoodLift, lastSessionDate, weeklyFrequency, moodTrend, radarAvg, lastGoal }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/actions/training-log.schema.ts app/actions/training-log.ts
git commit -m "feat: training log server action and stats computation"
```

---

## Task 3: Tests for Stats Logic

**Files:**
- Create: `app/actions/__tests__/training-log.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// app/actions/__tests__/training-log.test.ts
import { describe, it, expect } from 'vitest'
import { computeStats } from '../training-log'

const today = new Date()
today.setHours(12, 0, 0, 0)

function daysAgo(n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const baseLogs = [
  { logged_at: daysAgo(0), mood_before: 2, mood_after: 4, technique: 3, conditioning: 4, mental: 3, next_goal: 'Work on guard' },
  { logged_at: daysAgo(1), mood_before: 3, mood_after: 4, technique: null, conditioning: null, mental: null, next_goal: null },
  { logged_at: daysAgo(2), mood_before: 1, mood_after: 3, technique: 4, conditioning: 3, mental: 5, next_goal: null },
]

describe('computeStats', () => {
  it('counts total sessions', () => {
    const stats = computeStats(baseLogs)
    expect(stats.totalSessions).toBe(3)
  })

  it('computes streak for consecutive days', () => {
    const stats = computeStats(baseLogs)
    expect(stats.currentStreak).toBe(3)
  })

  it('breaks streak when a day is missing', () => {
    const gapLogs = [
      { logged_at: daysAgo(0), mood_before: 3, mood_after: 4, technique: null, conditioning: null, mental: null, next_goal: null },
      { logged_at: daysAgo(2), mood_before: 2, mood_after: 3, technique: null, conditioning: null, mental: null, next_goal: null },
    ]
    expect(computeStats(gapLogs).currentStreak).toBe(1)
  })

  it('computes avg mood lift', () => {
    const stats = computeStats(baseLogs)
    // lifts: +2, +1, +2 → avg = 5/3 ≈ 1.7
    expect(stats.avgMoodLift).toBe(1.7)
  })

  it('returns null avgMoodLift when no mood_after entries', () => {
    const noAfter = baseLogs.map(l => ({ ...l, mood_after: null }))
    expect(computeStats(noAfter).avgMoodLift).toBeNull()
  })

  it('returns lastGoal from most recent log with a goal', () => {
    expect(computeStats(baseLogs).lastGoal).toBe('Work on guard')
  })

  it('returns null lastGoal when none set', () => {
    const noGoal = baseLogs.map(l => ({ ...l, next_goal: null }))
    expect(computeStats(noGoal).lastGoal).toBeNull()
  })

  it('returns 12 weekly frequency buckets', () => {
    const stats = computeStats(baseLogs)
    expect(stats.weeklyFrequency).toHaveLength(12)
  })

  it('returns mood trend ascending', () => {
    const stats = computeStats(baseLogs)
    expect(stats.moodTrend[0].date).toBeLessThanOrEqual(stats.moodTrend[1].date)
  })

  it('computes radar averages from recent logs', () => {
    const stats = computeStats(baseLogs)
    expect(stats.radarAvg).not.toBeNull()
    expect(stats.radarAvg!.technique).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run app/actions/__tests__/training-log.test.ts
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/actions/__tests__/training-log.test.ts
git commit -m "test: training log stats computation"
```

---

## Task 4: TrainingLogDrawer Component

**Files:**
- Create: `components/members/TrainingLogDrawer.tsx`

- [ ] **Step 1: Create drawer**

```typescript
// components/members/TrainingLogDrawer.tsx
'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { logTraining } from '@/app/actions/training-log'
import { cn } from '@/lib/utils/cn'

const FOCUS_TAGS = ['Guard', 'Passing', 'Takedowns', 'No-Gi', 'Kondition', 'Sparring', 'Technik', 'Submissions']

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

interface Props {
  sessionId?: string | null
  onClose: () => void
  onSuccess?: () => void
}

function ScaleRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded border text-sm font-bold transition-colors',
              value === n
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function MoodRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-3">
        {MOOD_EMOJIS.map((emoji, i) => {
          const v = i + 1
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-xl transition-all',
                value === v
                  ? 'border-primary bg-primary/10 scale-110'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type Step = 1 | 2 | 3 | 4

export function TrainingLogDrawer({ sessionId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    mood_before:  null as number | null,
    mood_after:   null as number | null,
    energy:       null as number | null,
    technique:    null as number | null,
    conditioning: null as number | null,
    mental:       null as number | null,
    focus_areas:  [] as string[],
    notes:        '',
    next_goal:    '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      focus_areas: f.focus_areas.includes(tag)
        ? f.focus_areas.filter(t => t !== tag)
        : [...f.focus_areas, tag],
    }))
  }

  function handleSubmit() {
    if (!form.mood_before) { setError('Bitte Stimmung vorher angeben.'); return }
    setError(null)
    startTransition(async () => {
      const result = await logTraining({
        session_id:   sessionId ?? null,
        mood_before:  form.mood_before!,
        mood_after:   form.mood_after ?? undefined,
        energy:       form.energy ?? undefined,
        technique:    form.technique ?? undefined,
        conditioning: form.conditioning ?? undefined,
        mental:       form.mental ?? undefined,
        focus_areas:  form.focus_areas,
        notes:        form.notes || undefined,
        next_goal:    form.next_goal || undefined,
      })
      if (result.error) { setError(result.error); return }
      onSuccess?.()
      onClose()
    })
  }

  const stepTitles: Record<Step, string> = {
    1: 'Stimmung & Energie',
    2: 'Fokus & Selbstbewertung',
    3: 'Notizen & Ziel',
    4: 'Zusammenfassung',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-[90vh] w-full flex-col border-t border-border bg-card sm:h-full sm:max-w-sm sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Schritt {step}/3</p>
            <h2 className="text-base font-black text-foreground">{stepTitles[step]}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-1 bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <>
              <MoodRow label="Stimmung VORHER" value={form.mood_before} onChange={v => setForm(f => ({ ...f, mood_before: v }))} />
              <MoodRow label="Stimmung NACHHER" value={form.mood_after} onChange={v => setForm(f => ({ ...f, mood_after: v }))} />
              <ScaleRow label="⚡ Energie (1–5)" value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} />
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Fokus-Bereiche</p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded border px-3 py-1 text-xs font-bold transition-colors',
                        form.focus_areas.includes(tag)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <ScaleRow label="Technik (1–5)" value={form.technique} onChange={v => setForm(f => ({ ...f, technique: v }))} />
              <ScaleRow label="Kondition (1–5)" value={form.conditioning} onChange={v => setForm(f => ({ ...f, conditioning: v }))} />
              <ScaleRow label="Mental (1–5)" value={form.mental} onChange={v => setForm(f => ({ ...f, mental: v }))} />
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Notizen
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  placeholder="Was lief gut? Was möchtest du verbessern?"
                  className="w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Ziel für nächste Session
                </label>
                <input
                  type="text"
                  value={form.next_goal}
                  onChange={e => setForm(f => ({ ...f, next_goal: e.target.value }))}
                  placeholder="z.B. Rear naked choke aus back control"
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => (s - 1) as Step)}
              className="border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
            >
              Zurück
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !form.mood_before) { setError('Bitte Stimmung vorher angeben.'); return }
                setError(null)
                setStep(s => (s + 1) as Step)
              }}
              className="flex-1 bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'Speichern...' : 'Training speichern ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/members/TrainingLogDrawer.tsx
git commit -m "feat: TrainingLogDrawer multi-step form"
```

---

## Task 5: TrainingLogBanner Component

**Files:**
- Create: `components/members/TrainingLogBanner.tsx`

- [ ] **Step 1: Create banner**

```typescript
// components/members/TrainingLogBanner.tsx
'use client'

import { useState } from 'react'
import { TrainingLogDrawer } from './TrainingLogDrawer'

interface Props {
  sessionId: string | null
}

export function TrainingLogBanner({ sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <>
      <div className="mb-6 flex items-center justify-between border border-primary/30 bg-primary/5 px-5 py-4">
        <div>
          <p className="text-sm font-black text-foreground">🥋 Du warst heute im Training!</p>
          <p className="text-xs text-muted-foreground">Wie war es? Logge deine Session.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Später
          </button>
          <button
            onClick={() => setOpen(true)}
            className="bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Jetzt loggen →
          </button>
        </div>
      </div>

      {open && (
        <TrainingLogDrawer
          sessionId={sessionId}
          onClose={() => setOpen(false)}
          onSuccess={() => setDismissed(true)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/members/TrainingLogBanner.tsx
git commit -m "feat: TrainingLogBanner post-check-in prompt"
```

---

## Task 6: Chart Components

**Files:**
- Create: `components/members/TrainingFrequencyChart.tsx`
- Create: `components/members/MoodTrendChart.tsx`
- Create: `components/members/SkillRadarChart.tsx`

- [ ] **Step 1: Install Recharts**

```bash
npm install recharts
```
Expected: `recharts` in `package.json` dependencies.

- [ ] **Step 2: Create TrainingFrequencyChart**

```typescript
// components/members/TrainingFrequencyChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { week: string; count: number }[]
}

export function TrainingFrequencyChart({ data }: Props) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const lastWeek = data[data.length - 1]?.week

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Trainingsfrequenz</p>
      <p className="mb-4 text-sm font-semibold text-foreground">Letzte 12 Wochen</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={w => w.slice(5)} // MM-DD
            interval={2}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, maxVal + 1]}
          />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v: number) => [`${v} Session${v !== 1 ? 's' : ''}`, '']}
            labelFormatter={w => `Woche ${w}`}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.week}
                fill={entry.week === lastWeek ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create MoodTrendChart**

```typescript
// components/members/MoodTrendChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: { date: string; mood_before: number; mood_after: number | null }[]
}

export function MoodTrendChart({ data }: Props) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stimmungsverlauf</p>
      <p className="mb-4 text-sm font-semibold text-foreground">Training hebt die Stimmung</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={d => d.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v: number, name: string) => [v, name === 'mood_before' ? 'Vorher' : 'Nachher']}
          />
          <Legend formatter={v => v === 'mood_before' ? 'Vorher' : 'Nachher'} wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="mood_before" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="mood_after" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Create SkillRadarChart**

```typescript
// components/members/SkillRadarChart.tsx
'use client'

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  data: { technique: number; conditioning: number; mental: number } | null
}

export function SkillRadarChart({ data }: Props) {
  const chartData = [
    { subject: 'Technik',  value: data?.technique ?? 0 },
    { subject: 'Kondition', value: data?.conditioning ?? 0 },
    { subject: 'Mental',   value: data?.mental ?? 0 },
  ]

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Selbstbewertung</p>
      <p className="mb-2 text-sm font-semibold text-foreground">Ø letzte 30 Tage</p>
      {!data ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Noch keine Daten</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/members/TrainingFrequencyChart.tsx components/members/MoodTrendChart.tsx components/members/SkillRadarChart.tsx package.json package-lock.json
git commit -m "feat: Recharts frequency/mood/radar chart components"
```

---

## Task 7: MotivationWidget

**Files:**
- Create: `components/members/MotivationWidget.tsx`

- [ ] **Step 1: Create widget**

```typescript
// components/members/MotivationWidget.tsx
import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  streak: number
  totalSessions: number
  lastSessionDate: string | null
  lastGoal: string | null
}

export function MotivationWidget({ streak, totalSessions, lastSessionDate, lastGoal }: Props) {
  const daysSinceLast = lastSessionDate
    ? differenceInDays(new Date(), parseISO(lastSessionDate))
    : null

  function getMotivationMessage() {
    if (totalSessions === 0) return { emoji: '🥋', text: 'Starte deinen ersten Training-Log!' }
    if (streak >= 7) return { emoji: '🔥', text: `${streak} Sessions in Folge — du bist auf einem guten Weg!` }
    if (streak >= 3) return { emoji: '⚡', text: `${streak} Sessions in Folge — bleib dran!` }
    if (daysSinceLast !== null && daysSinceLast > 7) return { emoji: '💪', text: `Komm zurück — letztes Training vor ${daysSinceLast} Tagen.` }
    if (daysSinceLast === 0) return { emoji: '✅', text: 'Gut gemacht — du warst heute dabei!' }
    return { emoji: '🎯', text: `${totalSessions} Trainings gesamt. Weiter so!` }
  }

  const { emoji, text } = getMotivationMessage()

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Motivation</p>
      <p className="mb-4 text-2xl">{emoji}</p>
      <p className="text-sm font-semibold text-foreground">{text}</p>

      {lastGoal && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dein letztes Ziel</p>
          <p className="mt-1 text-sm italic text-foreground">"{lastGoal}"</p>
        </div>
      )}

      {lastSessionDate && (
        <p className="mt-3 text-xs text-muted-foreground">
          Letztes Training: {formatDistanceToNow(parseISO(lastSessionDate), { addSuffix: true, locale: de })}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/members/MotivationWidget.tsx
git commit -m "feat: MotivationWidget with streak and goal display"
```

---

## Task 8: Update Member Dashboard

**Files:**
- Modify: `app/(members)/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard page**

Replace the entire file `app/(members)/dashboard/page.tsx` with:

```typescript
// app/(members)/dashboard/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NextClassCard } from '@/components/members/NextClassCard'
import { BeltProgress } from '@/components/members/BeltProgress'
import { MemberQRCode } from '@/components/members/MemberQRCode'
import { OpeningHoursWidget } from '@/components/members/OpeningHoursWidget'
import { TrainingLogBanner } from '@/components/members/TrainingLogBanner'
import { TrainingFrequencyChart } from '@/components/members/TrainingFrequencyChart'
import { MoodTrendChart } from '@/components/members/MoodTrendChart'
import { SkillRadarChart } from '@/components/members/SkillRadarChart'
import { MotivationWidget } from '@/components/members/MotivationWidget'
import { TrainingLogButton } from '@/components/members/TrainingLogButton'
import { calcReadiness } from '@/lib/utils/belt'
import { differenceInMonths } from 'date-fns'
import { translations } from '@/lib/i18n'
import { resolveLang } from '@/lib/i18n/resolve-lang'
import { getGymSettings } from '@/lib/gym-settings'
import { getTrainingStats } from '@/app/actions/training-log'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface ClassType { name: string; gi: boolean; level: string }
interface BookingRow { id: string }
interface BeltRankRow {
  name: string; stripes: number; color_hex: string | null
  min_sessions: number | null; min_time_months: number | null
}

export default async function DashboardPage() {
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)
  const t = translations[lang]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const now = new Date().toISOString()
  const gym = await getGymSettings()

  const [
    { data: nextSessions },
    { count: attendanceCount },
    { count: bookingCount },
    { data: rankHistory },
    { data: latestAttendance },
    { data: latestLog },
    trainingStats,
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select(`id, starts_at, ends_at, location, class_types(name, gi, level), bookings!inner(id, profile_id, status)`)
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
    // Most recent attendance
    supabase
      .from('attendances')
      .select('id, session_id, checked_in_at')
      .eq('profile_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(1),
    // Most recent training log
    supabase
      .from('training_logs')
      .select('id, session_id')
      .eq('profile_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1),
    getTrainingStats(),
  ])

  // Check if latest attendance has no log yet → show banner
  const latestAtt = latestAttendance?.[0] ?? null
  const latestLogEntry = latestLog?.[0] ?? null
  const showBanner = latestAtt !== null &&
    (latestLogEntry === null || latestLogEntry.session_id !== latestAtt.session_id)

  // Next session
  const raw = nextSessions?.[0] ?? null
  const rawBookings = raw?.bookings as BookingRow[] | BookingRow | null | undefined
  const bookingId = (Array.isArray(rawBookings) ? rawBookings[0] : rawBookings)?.id ?? null
  const rawCT = raw?.class_types as ClassType[] | ClassType | null | undefined
  const classType: ClassType | null = Array.isArray(rawCT) ? (rawCT[0] ?? null) : (rawCT ?? null)
  const nextSession = raw ? { id: raw.id, starts_at: raw.starts_at, ends_at: raw.ends_at, location: raw.location, class_types: classType } : null

  // Belt
  const latestRankRow = rankHistory?.[0] ?? null
  const rawBeltRank = latestRankRow?.belt_ranks
  const beltRank: BeltRankRow | null = Array.isArray(rawBeltRank) ? (rawBeltRank[0] ?? null) : (rawBeltRank as BeltRankRow | null) ?? null
  const monthsInGrade = latestRankRow?.promoted_at ? differenceInMonths(new Date(), new Date(latestRankRow.promoted_at)) : 0
  const readiness = calcReadiness(attendanceCount ?? 0, beltRank?.min_sessions ?? null, monthsInGrade, beltRank?.min_time_months ?? null)

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">{t.dashboard.title}</h1>
        <TrainingLogButton />
      </div>

      {showBanner && <TrainingLogBanner sessionId={latestAtt.session_id} />}

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.trainingsTotal}</p>
            <p className="mt-1 font-mono text-3xl font-black text-foreground">{attendanceCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
            <p className="mt-1 font-mono text-3xl font-black text-foreground">
              {trainingStats.currentStreak > 0 ? `🔥 ${trainingStats.currentStreak}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ø Stimmung</p>
            <p className="mt-1 font-mono text-3xl font-black text-foreground">
              {trainingStats.avgMoodLift !== null
                ? `${trainingStats.avgMoodLift > 0 ? '+' : ''}${trainingStats.avgMoodLift}`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboard.activeBookings}</p>
            <p className="mt-1 font-mono text-3xl font-black text-foreground">{bookingCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <NextClassCard session={nextSession} bookingId={bookingId} lang={lang} />
        </div>
        <div>
          <MotivationWidget
            streak={trainingStats.currentStreak}
            totalSessions={trainingStats.totalSessions}
            lastSessionDate={trainingStats.lastSessionDate}
            lastGoal={trainingStats.lastGoal}
          />
        </div>

        {trainingStats.weeklyFrequency.length > 0 && (
          <div className="sm:col-span-2">
            <TrainingFrequencyChart data={trainingStats.weeklyFrequency} />
          </div>
        )}
        {trainingStats.moodTrend.length > 1 && (
          <div>
            <MoodTrendChart data={trainingStats.moodTrend} />
          </div>
        )}
        {trainingStats.radarAvg && (
          <div>
            <SkillRadarChart data={trainingStats.radarAvg} />
          </div>
        )}

        <div className="sm:col-span-2 lg:col-span-3">
          <BeltProgress
            beltName={beltRank?.name ?? null}
            stripes={beltRank?.stripes ?? 0}
            colorHex={beltRank?.color_hex ?? null}
            readiness={readiness}
            sessionsAttended={attendanceCount ?? 0}
            monthsInGrade={monthsInGrade}
            lang={lang}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <MemberQRCode profileId={userId} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <OpeningHoursWidget hours={gym.opening_hours} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create TrainingLogButton (manual trigger)**

```typescript
// components/members/TrainingLogButton.tsx
'use client'

import { useState } from 'react'
import { TrainingLogDrawer } from './TrainingLogDrawer'

export function TrainingLogButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        + Training loggen
      </button>
      {open && <TrainingLogDrawer sessionId={null} onClose={() => setOpen(false)} />}
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```
Expected: all 232+ tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/(members)/dashboard/page.tsx components/members/TrainingLogButton.tsx
git commit -m "feat: member dashboard with training stats, charts, motivation"
```

---

## Task 9: Deploy

- [ ] **Step 1: Push and deploy**

```bash
git push
vercel --prod
```
Expected: deployment READY, no build errors.

- [ ] **Step 2: Run migration in Supabase**

In Supabase Dashboard → SQL Editor, run `supabase/migrations/20260420_training_logs.sql`.
Expected: table `training_logs` visible in Table Editor with all columns.

- [ ] **Step 3: Smoke test**

1. Log in as a member
2. Visit `/dashboard` — stats cards show, motivation widget visible
3. Click "+ Training loggen" — drawer opens, fill all 3 steps, save
4. Refresh — frequency chart appears, motivation updates
5. Log in as admin, check in a member → member sees banner on next dashboard visit

---

## Self-Review

**Spec coverage:**
- ✅ training_logs table (Task 1)
- ✅ mood_before/after, energy, technique, conditioning, mental, focus_areas, notes, next_goal (Task 2)
- ✅ Auto-trigger after check-in (TrainingLogBanner, Task 5 + 8)
- ✅ Manual entry (TrainingLogButton, Task 8)
- ✅ Stats: totalSessions, streak, avgMoodLift, lastSessionDate (Task 2 + 8)
- ✅ Weekly frequency BarChart (Task 6)
- ✅ Mood trend LineChart (Task 6)
- ✅ Skill radar RadarChart (Task 6)
- ✅ Motivation widget with streak/goal (Task 7)
- ✅ Dashboard layout updated (Task 8)
- ✅ Recharts installed (Task 6)

**No placeholders:** All steps contain full code.

**Type consistency:** `TrainingStats` interface defined in Task 2, used in Task 8. `computeStats` exported in Task 2, tested in Task 3. Component props match their implementations throughout.
