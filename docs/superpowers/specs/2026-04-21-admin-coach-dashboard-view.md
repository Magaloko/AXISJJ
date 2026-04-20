# Admin = Coach Dashboard View

**Date:** 2026-04-21
**Scope:** Owner dashboard shows coach-style layout with gym-wide data instead of business-metrics layout

---

## Problem

The owner is simultaneously the Head Coach. The current owner dashboard shows business KPIs (revenue, leads, inactive members, charts) which belong in Berichte. The daily workflow view — sessions today, upcoming class, schedule — is more useful at a glance.

---

## Design

The `role === 'owner'` branch in `app/(admin)/admin/dashboard/page.tsx` switches from the current business-metrics layout to the coach layout, using gym-wide data instead of per-coach data.

### Stat strip (4 cards, same 2×2 → 4-col grid)

| Card | Data source |
|------|-------------|
| Alle Klassen heute | `data.todaySessions.length` |
| Buchungen heute | `data.bookingsToday` |
| Alle Mitglieder | `data.activeMembers` |
| Check-Ins heute | `data.checkinsToday` |

### Layout order (same as coach view)

1. Stat strip
2. Next class card (next upcoming session across all gym sessions)
3. Today's full schedule (all sessions, not filtered by coach)
4. Promotions ready widget (replaces My Students — owner-relevant at a glance)

### What does NOT change

- Sidebar navigation stays identical (all management sections remain accessible)
- Business metrics (revenue, utilization, leads, inactive members) remain in Berichte
- The 3-card secondary metrics row (lead conversion, revenue delta, fill rate) is removed from dashboard — available in Berichte
- `getAdminDashboard()` already returns `todaySessions` gym-wide — no new DB queries needed
- `data.activeMembers` already available from `getAdminDashboard()`

---

## Files Changed

| File | Change |
|------|--------|
| `app/(admin)/admin/dashboard/page.tsx` | Replace owner branch with coach-style layout using gym-wide data |

---

## Out of Scope

- Moving any sidebar items
- Changing data fetching in `getAdminDashboard()`
- Changing the coach view (unchanged)
