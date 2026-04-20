# Admin Dashboard Redesign

**Date:** 2026-04-20
**Scope:** Navigation restructure + dashboard layout overhaul (mobile-first)

---

## Problem

- Mobile navigation uses a hamburger drawer — requires 2 taps to reach any page, bad UX for coaches and owners who primarily use mobile
- Admin sidebar "Management" section has 10 items with no grouping — hard to scan
- Dashboard layout is not optimized for small screens (charts overflow, key info buried)
- Missing key metrics: lead conversion rate, monthly revenue vs. prior month, class fill rate average

---

## Approach

Option C (approved): Role-scoped bottom tab bar on mobile + reorganized sidebar on desktop.

---

## Navigation Design

### Mobile — Bottom Tab Bar (replaces hamburger top bar entirely)

**Coach (4 tabs):**
| Tab | Icon | Route |
|-----|------|-------|
| Dashboard | LayoutDashboard | /admin/dashboard |
| Check-In | CheckSquare | /admin/checkin |
| Training | CalendarDays | /admin/klassen |
| Schüler | Users | /admin/mitglieder |

**Owner (5 tabs):**
| Tab | Icon | Route |
|-----|------|-------|
| Dashboard | LayoutDashboard | /admin/dashboard |
| Mitglieder | Users | /admin/mitglieder |
| Check-In | CheckSquare | /admin/checkin |
| Berichte | FileText | /admin/berichte |
| Mehr ··· | MoreHorizontal | opens bottom sheet |

**Owner "Mehr" bottom sheet contents:**
Gürtel · Leads · Blog · Curriculum · Hero Slider · Gym · Einstellungen · Audit-Log

### Desktop — Reorganized Sidebar (w-60, same width)

```
─── OPS ──────────────────────  (both roles)
  Dashboard
  Check-In
  Training

─── MITGLIEDER ───────────────  (owner only)
  Mitglieder
  Gürtel
  Leads

─── BUSINESS ─────────────────  (owner only)
  Berichte

─── CONTENT ──────────────────  (owner only)
  Blog
  Curriculum
  Hero Slider

─── SYSTEM ───────────────────  (owner only)
  Gym
  Einstellungen
  Audit-Log
```

Coaches see only OPS — no section headers, 3 items only.

---

## Dashboard Layout

Mobile-first single-column stack. Desktop promotes key pairs to 2-column where noted.

### Owner view (top → bottom)

1. **Stat strip** — 2×2 grid on mobile, 4-col on desktop
   - Active members
   - New leads (this month)
   - Check-ins today
   - Estimated monthly revenue

2. **Next class card** (full width) — class name, time, capacity bar

3. **Promotions ready | Birthdays** — 2-col on desktop, stacked on mobile

4. **Today's schedule** — compact list (name · time · bookings/capacity)

5. **Utilization trend | Top classes** — 2-col on desktop, stacked on mobile

6. **Inactive members | Leads mini-kanban** — 2-col on desktop, stacked on mobile

### Coach view (top → bottom)

1. **Stat strip** — 2×2 grid
   - Classes today
   - Classes this week
   - My students (last 30d)
   - Check-ins today

2. **Next class card** (full width)

3. **Today's schedule** (compact list)

4. **My students widget**

---

## New Metrics (Owner Dashboard)

Three new stat/widget additions:

| Metric | Calculation | Placement |
|--------|-------------|-----------|
| Lead conversion rate | members gained this month / leads this month × 100 | Additional stat card below main strip |
| Revenue vs. last month | current month estimated revenue delta % | RevenueWidget subtitle |
| Class fill rate avg | avg(confirmedCount / capacity) across last 30d sessions × 100 | UtilizationChart subtitle or separate stat card |

---

## Component Changes

| File | Change |
|------|--------|
| `components/admin/AdminNav.tsx` | Add mobile bottom bar (role-scoped tabs + More sheet); reorganize desktop sidebar into 5 sections |
| `app/(admin)/admin/dashboard/page.tsx` | Reorder layout per new section order; add 3 new metric computations |
| `app/actions/owner-insights.ts` | Add `leadConversionRate`, `revenueVsLastMonth`, `avgClassFillRate` |

---

## Out of Scope

- Redesigning any page other than the dashboard layout order
- New Supabase tables or schema changes
- Changes to coach-only pages (checkin, klassen detail, etc.)
