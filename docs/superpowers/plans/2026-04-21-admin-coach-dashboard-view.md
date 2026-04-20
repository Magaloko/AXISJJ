# Admin=Coach Dashboard View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the owner dashboard to show a coach-style layout (sessions, schedule, promotions) using gym-wide data instead of the current business-metrics layout.

**Architecture:** Single file change to `app/(admin)/admin/dashboard/page.tsx` — replace the owner-branch JSX with the coach layout pattern, substituting gym-wide data from `getAdminDashboard()` for the per-coach data.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `app/(admin)/admin/dashboard/page.tsx` | Replace owner branch with coach-style layout |

---

## Task 1: Replace Owner Dashboard Branch

**Files:**
- Modify: `app/(admin)/admin/dashboard/page.tsx`

### Step 1.1 — Replace the owner branch

- [ ] Open `app/(admin)/admin/dashboard/page.tsx`. Find the owner return branch (it starts around `// ── Owner view` and contains the stat strip with Members/Leads/Check-ins/Revenue, secondary metrics, charts, etc.).

Replace the entire owner branch (from `// ── Owner view` to end of the file) with:

```tsx
  // ── Owner view (coach layout with gym-wide data) ──────────────────────────
  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

      {/* Stat strip: 4 gym-wide KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Klassen heute" value={data.todaySessions?.length ?? 0} highlight />
        <AdminStatCard label="Buchungen heute" value={data.bookingsToday} />
        <AdminStatCard label="Alle Mitglieder" value={data.activeMembers ?? 0} />
        <AdminStatCard label="Check-Ins heute" value={data.checkinsToday} />
      </div>

      {/* Next class */}
      {upcomingSession && (
        <NextClassCard session={upcomingSession} formatTime={formatTime} />
      )}

      {/* Today's full schedule */}
      <TodayScheduleCard sessions={data.todaySessions ?? []} formatTime={formatTime} />

      {/* Promotions ready */}
      {data.promotionsReady && data.promotionsReady.length > 0 && (
        <div className="mt-6">
          <PromotionsWidget promotions={data.promotionsReady} />
        </div>
      )}
    </div>
  )
}
```

Also **remove the following imports** that are no longer used in the owner branch (check if they're still used in the coach branch — remove only if unused):
- `UtilizationChart`
- `TopClassesChart`
- `RevenueWidget`
- `InactiveMembersWidget`
- `BirthdaysWidget`
- `LeadsMiniKanban`
- `getOwnerInsights` (remove from `Promise.all` call and import)
- `getUpcomingBirthdays` (remove from `Promise.all` call and import)

**Important:** `PromotionsWidget`, `CoachTodaySchedule`, `MyStudentsWidget` might still be used in the coach branch — only remove from imports if truly unused in BOTH branches.

After cleanup, the `Promise.all` at the top of the page becomes:

```tsx
  const [data, coachInsights] = await Promise.all([
    getAdminDashboard(),
    getCoachInsights().catch(() => null),
  ])
```

### Step 1.2 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors (3 pre-existing Hero.test.tsx errors OK)

### Step 1.3 — Run tests

- [ ] Run: `npx vitest run`
- Expected: same pass/fail as baseline

### Step 1.4 — Commit and push

- [ ] Run:
```bash
git add "app/(admin)/admin/dashboard/page.tsx"
git commit -m "feat: owner dashboard shows coach-style layout with gym-wide data"
git push origin main
```
