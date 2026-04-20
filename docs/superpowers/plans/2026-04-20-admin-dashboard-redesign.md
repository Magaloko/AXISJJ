# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hamburger mobile nav with a role-scoped bottom tab bar, reorganize the desktop sidebar into labeled sections, reorder the dashboard layout for mobile-first scanning, and add three new owner metrics (lead conversion rate, revenue vs last month, avg class fill rate).

**Architecture:** Three isolated changes — (1) `owner-insights.ts` gets new computed fields, (2) `AdminNav.tsx` gets a new mobile bottom bar and reorganized desktop sidebar, (3) `dashboard/page.tsx` gets a reordered layout and new stat cards. Each can be developed and tested independently.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, Supabase, Vitest + React Testing Library, Lucide icons

---

## File Map

| File | Change |
|------|--------|
| `app/actions/owner-insights.ts` | Add `leadConversionRate`, `revenueVsLastMonthPct`, `avgClassFillRate` to `OwnerInsights` interface and computation |
| `app/actions/__tests__/owner-insights.test.ts` | Add tests for the 3 new fields |
| `components/admin/AdminNav.tsx` | Replace mobile hamburger top bar with fixed bottom tab bar; reorganize desktop sidebar into 5 labeled sections |
| `app/(admin)/admin/layout.tsx` | Add `pb-16 lg:pb-0` to main so content isn't hidden behind bottom bar |
| `app/(admin)/admin/dashboard/page.tsx` | Reorder layout sections; render new metric stat cards |

---

## Task 1: New metrics in `getOwnerInsights` (TDD)

**Files:**
- Modify: `app/actions/owner-insights.ts`
- Modify: `app/actions/__tests__/owner-insights.test.ts`

### Step 1.1 — Add fields to `OwnerInsights` interface

- [ ] Open `app/actions/owner-insights.ts` and extend the interface:

```ts
export interface OwnerInsights {
  utilizationTrend: UtilizationWeek[]
  topClasses: TopClass[]
  estimatedMonthlyRevenue: number
  activeMembers: number
  revenueBreakdown: { category: string; members: number; revenue: number }[]
  inactiveMembers: InactiveMember[]
  leadConversionRate: number        // % leads converted this month
  revenueVsLastMonthPct: number     // % delta vs last month (positive = growth)
  avgClassFillRate: number          // % avg fill across last 30d sessions
  error?: string
}
```

Also update the `empty` object inside `getOwnerInsights` to include the new fields:

```ts
const empty: OwnerInsights = {
  utilizationTrend: [], topClasses: [],
  estimatedMonthlyRevenue: 0, activeMembers: 0, revenueBreakdown: [],
  inactiveMembers: [],
  leadConversionRate: 0,
  revenueVsLastMonthPct: 0,
  avgClassFillRate: 0,
}
```

### Step 1.2 — Write failing tests

- [ ] Open `app/actions/__tests__/owner-insights.test.ts` and add a new `describe` block at the end of the file:

```ts
describe('getOwnerInsights — new metrics', () => {
  function makeOwnerChain() {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
    }
  }

  function makeEmptyChain() {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
  }

  function makeCountChain(count: number) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count, error: null }),
    }
  }

  function makeSubsChain(subs: { category: string; price_per_month: number }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: subs, error: null }),
    }
  }

  function makeLastMonthSubsChain(subs: { price_per_month: number }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: subs, error: null }),
    }
  }

  function makeLeadsChain(leads: { status: string; created_at: string }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: leads, error: null }),
    }
  }

  function makeSessionsChain(sessions: { capacity: number; bookings: { status: string }[] }[]) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: sessions, error: null }),
    }
  }

  it('computes leadConversionRate as 0 when no leads this month', async () => {
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])        // class_sessions
      if (call === 3) return makeEmptyChain()             // attendances
      if (call === 4) return makeCountChain(0)            // members count
      if (call === 5) return makeSubsChain([])            // active subs
      if (call === 6) return makeLastMonthSubsChain([])   // last month subs
      if (call === 7) return makeLeadsChain([])           // leads this month
      if (call === 8) return makeEmptyChain()             // member list
      if (call === 9) return makeEmptyChain()             // recent attendances
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.leadConversionRate).toBe(0)
  })

  it('computes leadConversionRate correctly', async () => {
    const now = new Date()
    const thisMonth = now.toISOString()
    const leads = [
      { status: 'converted', created_at: thisMonth },
      { status: 'converted', created_at: thisMonth },
      { status: 'new', created_at: thisMonth },
      { status: 'lost', created_at: thisMonth },
    ]
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain(leads)
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.leadConversionRate).toBe(50) // 2/4 × 100
  })

  it('computes revenueVsLastMonthPct as 0 when last month had no revenue', async () => {
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain([])
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([{ category: 'adults', price_per_month: 100 }])
      if (call === 6) return makeLastMonthSubsChain([])   // last month = 0
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.revenueVsLastMonthPct).toBe(0)
  })

  it('computes avgClassFillRate from session data', async () => {
    const sessions = [
      { capacity: 10, bookings: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'cancelled' }] },
      { capacity: 10, bookings: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'confirmed' }, { status: 'confirmed' }] },
    ]
    // session 1: 2/10 = 20%, session 2: 4/10 = 40%, avg = 30%
    let call = 0
    mockSupabase.from.mockImplementation(() => {
      call++
      if (call === 1) return makeOwnerChain()
      if (call === 2) return makeSessionsChain(sessions)
      if (call === 3) return makeEmptyChain()
      if (call === 4) return makeCountChain(0)
      if (call === 5) return makeSubsChain([])
      if (call === 6) return makeLastMonthSubsChain([])
      if (call === 7) return makeLeadsChain([])
      if (call === 8) return makeEmptyChain()
      if (call === 9) return makeEmptyChain()
      return makeEmptyChain()
    })
    const result = await getOwnerInsights()
    expect(result.avgClassFillRate).toBe(30)
  })
})
```

### Step 1.3 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/owner-insights.test.ts`
- Expected: new tests FAIL (fields don't exist yet on the returned object)

### Step 1.4 — Implement the new computations in `getOwnerInsights`

- [ ] In `app/actions/owner-insights.ts`, add a new query for last month subscriptions and leads. Find the section after the `activeSubs` query and add:

```ts
  // ── Last month date range ──
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1)

  const [lastMonthSubsResult, thisMonthLeadsResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('price_per_month')
      .lte('start_date', endOfLastMonth.toISOString().split('T')[0])
      .or(`end_date.is.null,end_date.gte.${startOfLastMonth.toISOString().split('T')[0]}`),
    supabase
      .from('leads')
      .select('status, created_at')
      .gte('created_at', startOfThisMonth.toISOString())
      .lte('created_at', now.toISOString()),
  ])

  // ── Lead conversion rate ──
  const thisMonthLeads = thisMonthLeadsResult.data ?? []
  const convertedCount = thisMonthLeads.filter(l => l.status === 'converted').length
  const leadConversionRate = thisMonthLeads.length > 0
    ? Math.round((convertedCount / thisMonthLeads.length) * 100)
    : 0

  // ── Revenue vs last month ──
  const lastMonthRevenue = (lastMonthSubsResult.data ?? [])
    .reduce((sum, s) => sum + Number(s.price_per_month), 0)
  const revenueVsLastMonthPct = lastMonthRevenue > 0
    ? Math.round(((estimatedMonthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0

  // ── Avg class fill rate (30d sessions, reuse sessionsResult) ──
  const thirtyDaySessions = (sessionsResult.data ?? []).filter(s => {
    return new Date(s.starts_at) >= thirtyDaysAgo
  })
  const fillRates = thirtyDaySessions
    .filter(s => s.capacity > 0)
    .map(s => {
      const confirmed = (s.bookings ?? []).filter(b => b.status === 'confirmed').length
      return confirmed / s.capacity
    })
  const avgClassFillRate = fillRates.length > 0
    ? Math.round((fillRates.reduce((a, b) => a + b, 0) / fillRates.length) * 100)
    : 0
```

- [ ] Update the `return` statement at the end of `getOwnerInsights` to include the new fields:

```ts
  return {
    utilizationTrend,
    topClasses,
    estimatedMonthlyRevenue,
    activeMembers,
    revenueBreakdown,
    inactiveMembers,
    leadConversionRate,
    revenueVsLastMonthPct,
    avgClassFillRate,
  }
```

### Step 1.5 — Run tests to verify they pass

- [ ] Run: `npx vitest run app/actions/__tests__/owner-insights.test.ts`
- Expected: all tests PASS

### Step 1.6 — Run full test suite

- [ ] Run: `npx vitest run`
- Expected: all tests PASS, no regressions

### Step 1.7 — Commit

- [ ] Run:
```bash
git add app/actions/owner-insights.ts app/actions/__tests__/owner-insights.test.ts
git commit -m "feat: add leadConversionRate, revenueVsLastMonthPct, avgClassFillRate to owner insights"
```

---

## Task 2: Redesign `AdminNav.tsx`

**Files:**
- Modify: `components/admin/AdminNav.tsx`
- Modify: `app/(admin)/admin/layout.tsx`

### Step 2.1 — Update layout to make room for bottom bar

- [ ] Open `app/(admin)/admin/layout.tsx` and change the `<main>` element's className:

Current:
```tsx
<main className="min-h-screen pb-4 pt-14 lg:pt-0">{children}</main>
```

New:
```tsx
<main className="min-h-screen pb-20 pt-0 lg:pb-4">{children}</main>
```

This removes the top padding (no more top bar) and adds bottom padding so content doesn't hide behind the bottom nav.

### Step 2.2 — Rewrite `AdminNav.tsx`

- [ ] Replace the entire contents of `components/admin/AdminNav.tsx` with:

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users, Award,
  ClipboardList, Settings, LogOut, Building2, ScrollText,
  BookOpen, MonitorPlay, FileText, GraduationCap, MoreHorizontal, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

type Role = 'coach' | 'owner'

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
}

// ── Desktop sidebar sections ────────────────────────────────────────────────

const opsItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',   label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',   label: 'Training',  Icon: CalendarDays },
]

const mitgliederItems: NavItem[] = [
  { href: '/admin/mitglieder', label: 'Mitglieder', Icon: Users },
  { href: '/admin/guertel',    label: 'Gürtel',     Icon: Award },
  { href: '/admin/leads',      label: 'Leads',      Icon: ClipboardList },
]

const businessItems: NavItem[] = [
  { href: '/admin/berichte', label: 'Berichte', Icon: FileText },
]

const contentItems: NavItem[] = [
  { href: '/admin/blog',       label: 'Blog',        Icon: BookOpen },
  { href: '/admin/curriculum', label: 'Curriculum',  Icon: GraduationCap },
  { href: '/admin/hero',       label: 'Hero Slider', Icon: MonitorPlay },
]

const systemItems: NavItem[] = [
  { href: '/admin/gym',           label: 'Gym',          Icon: Building2 },
  { href: '/admin/einstellungen', label: 'Einstellungen', Icon: Settings },
  { href: '/admin/audit',         label: 'Audit-Log',    Icon: ScrollText },
]

// ── Mobile bottom tabs ───────────────────────────────────────────────────────

const coachBottomTabs: NavItem[] = [
  { href: '/admin/dashboard',  label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/checkin',    label: 'Check-In',  Icon: CheckSquare },
  { href: '/admin/klassen',    label: 'Training',  Icon: CalendarDays },
  { href: '/admin/mitglieder', label: 'Schüler',   Icon: Users },
]

const ownerBottomTabs: NavItem[] = [
  { href: '/admin/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/admin/mitglieder', label: 'Mitglieder', Icon: Users },
  { href: '/admin/checkin',    label: 'Check-In',   Icon: CheckSquare },
  { href: '/admin/berichte',   label: 'Berichte',   Icon: FileText },
]

const ownerMoreItems: NavItem[] = [
  ...mitgliederItems.filter(i => i.href !== '/admin/mitglieder'),
  ...contentItems,
  ...systemItems,
]

// ── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground first:mt-2">
      {label}
    </p>
  )
}

function SidebarLink({ href, label, Icon, active, onClick }: NavItem & { active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}

// ── Desktop sidebar content ──────────────────────────────────────────────────

interface SidebarContentProps {
  role: Role
  roleBadge: string
  userName: string
  pathname: string
  onLogout: () => void
}

function SidebarContent({ role, roleBadge, userName, pathname, onLogout }: SidebarContentProps) {
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <div className="border-b border-border p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{roleBadge}</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{userName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {role === 'owner' && <SectionLabel label="OPS" />}
        {opsItems.map(item => (
          <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        {role === 'owner' && (
          <>
            <SectionLabel label="Mitglieder" />
            {mitgliederItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label="Business" />
            {businessItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label="Content" />
            {contentItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}

            <SectionLabel label="System" />
            {systemItems.map(item => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </>
  )
}

// ── Mobile bottom bar ────────────────────────────────────────────────────────

interface BottomBarProps {
  role: Role
  pathname: string
  onMoreClick: () => void
  onLogout: () => void
}

function BottomBar({ role, pathname, onMoreClick }: BottomBarProps) {
  const tabs = role === 'coach' ? coachBottomTabs : ownerBottomTabs

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border bg-card lg:hidden">
      {tabs.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isActive(href) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
      {role === 'owner' && (
        <button
          onClick={onMoreClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal size={20} />
          Mehr
        </button>
      )}
    </nav>
  )
}

// ── Owner "Mehr" bottom sheet ────────────────────────────────────────────────

interface MoreSheetProps {
  pathname: string
  onClose: () => void
  onLogout: () => void
}

function MoreSheet({ pathname, onClose, onLogout }: MoreSheetProps) {
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card pb-safe">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-bold text-foreground">Mehr</span>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-1 p-3">
          {ownerMoreItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────

interface Props {
  role: Role
  userName: string
}

export function AdminNav({ role, userName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const roleBadge = role === 'owner' ? 'AXIS Owner' : 'AXIS Coach'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-border bg-card lg:flex">
        <SidebarContent
          role={role}
          roleBadge={roleBadge}
          userName={userName}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile bottom bar */}
      <BottomBar
        role={role}
        pathname={pathname}
        onMoreClick={() => setMoreOpen(true)}
        onLogout={handleLogout}
      />

      {/* Owner "Mehr" sheet */}
      {moreOpen && (
        <MoreSheet
          pathname={pathname}
          onClose={() => setMoreOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}
```

### Step 2.3 — Run TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no errors

### Step 2.4 — Commit

- [ ] Run:
```bash
git add components/admin/AdminNav.tsx app/(admin)/admin/layout.tsx
git commit -m "feat: replace mobile hamburger with role-scoped bottom tab bar; reorganize desktop sidebar sections"
```

---

## Task 3: Reorder dashboard layout + add new metric cards

**Files:**
- Modify: `app/(admin)/admin/dashboard/page.tsx`

### Step 3.1 — Update the dashboard page

- [ ] Open `app/(admin)/admin/dashboard/page.tsx`. Replace the entire file content with:

```tsx
// app/(admin)/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboard } from '@/app/actions/admin'
import { getOwnerInsights } from '@/app/actions/owner-insights'
import { getCoachInsights } from '@/app/actions/coach-insights'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { PromotionsWidget } from '@/components/admin/PromotionsWidget'
import { LeadsMiniKanban } from '@/components/admin/LeadsMiniKanban'
import { UtilizationChart } from '@/components/admin/UtilizationChart'
import { TopClassesChart } from '@/components/admin/TopClassesChart'
import { RevenueWidget } from '@/components/admin/RevenueWidget'
import { CoachTodaySchedule } from '@/components/admin/CoachTodaySchedule'
import { MyStudentsWidget } from '@/components/admin/MyStudentsWidget'
import { InactiveMembersWidget } from '@/components/admin/InactiveMembersWidget'
import { BirthdaysWidget } from '@/components/admin/BirthdaysWidget'
import { getUpcomingBirthdays } from '@/app/actions/birthdays'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [data, ownerInsights, coachInsights, birthdays] = await Promise.all([
    getAdminDashboard(),
    getOwnerInsights().catch(() => null),
    getCoachInsights().catch(() => null),
    getUpcomingBirthdays(14).catch(() => []),
  ])

  if (data.error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }

  const role = data.role

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const now = new Date()
  const upcomingSession = data.todaySessions?.find(s => new Date(s.starts_at) > now)

  // ── Coach view ──────────────────────────────────────────────────────────────
  if (role === 'coach') {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

        {/* Stat strip */}
        {coachInsights && !coachInsights.error && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminStatCard label="Klassen heute" value={coachInsights.sessionsTodayCount} highlight />
            <AdminStatCard label="Diese Woche" value={coachInsights.sessionsWeekCount} />
            <AdminStatCard label="Meine Schüler (30T)" value={coachInsights.studentsLast30d} />
            <AdminStatCard label="Check-Ins heute" value={coachInsights.checkinsTodayCount} />
          </div>
        )}

        {/* Next class */}
        {upcomingSession && (
          <div className="mb-6 border border-border bg-card p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nächste Klasse
            </p>
            <p className="text-base font-black text-foreground">
              {upcomingSession.class_types?.name ?? 'Session'}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {formatTime(upcomingSession.starts_at)} – {formatTime(upcomingSession.ends_at)}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{upcomingSession.confirmedCount} Buchungen</span>
                <span>{upcomingSession.capacity} Plätze</span>
              </div>
              <div className="h-1.5 w-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (upcomingSession.confirmedCount / upcomingSession.capacity) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Today's schedule */}
        <div className="mb-6 border border-border bg-card p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Heutiger Plan
          </p>
          {(data.todaySessions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
          ) : (
            <ul className="space-y-2">
              {data.todaySessions?.map(s => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{s.class_types?.name ?? 'Session'}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatTime(s.starts_at)} · {s.confirmedCount}/{s.capacity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Coach schedule + students */}
        {coachInsights && !coachInsights.error && (
          <div className="grid gap-6 lg:grid-cols-2">
            <CoachTodaySchedule sessions={coachInsights.todaySessions} />
            <MyStudentsWidget students={coachInsights.students} />
          </div>
        )}
      </div>
    )
  }

  // ── Owner view ──────────────────────────────────────────────────────────────
  const insights = ownerInsights && !ownerInsights.error ? ownerInsights : null

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Dashboard</h1>

      {/* Stat strip: 4 primary KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Mitglieder" value={data.activeMembers ?? 0} />
        <AdminStatCard label="Neue Leads" value={data.newLeads ?? 0} highlight />
        <AdminStatCard label="Check-Ins heute" value={data.checkinsToday} />
        <AdminStatCard
          label="Umsatz (Monat)"
          value={insights ? `${insights.estimatedMonthlyRevenue.toLocaleString('de-DE')} €` : '—'}
        />
      </div>

      {/* Secondary metrics row */}
      {insights && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <AdminStatCard
            label="Lead-Konversion"
            value={`${insights.leadConversionRate} %`}
          />
          <AdminStatCard
            label="Umsatz vs. Vormonat"
            value={`${insights.revenueVsLastMonthPct > 0 ? '+' : ''}${insights.revenueVsLastMonthPct} %`}
          />
          <AdminStatCard
            label="Ø Auslastung (30T)"
            value={`${insights.avgClassFillRate} %`}
          />
        </div>
      )}

      {/* Next class */}
      {upcomingSession && (
        <div className="mb-6 border border-border bg-card p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Nächste Klasse
          </p>
          <p className="text-base font-black text-foreground">
            {upcomingSession.class_types?.name ?? 'Session'}
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatTime(upcomingSession.starts_at)} – {formatTime(upcomingSession.ends_at)}
          </p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{upcomingSession.confirmedCount} Buchungen</span>
              <span>{upcomingSession.capacity} Plätze</span>
            </div>
            <div className="h-1.5 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (upcomingSession.confirmedCount / upcomingSession.capacity) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Promotions + Birthdays */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {data.promotionsReady && <PromotionsWidget promotions={data.promotionsReady} />}
        {birthdays.length > 0 && <BirthdaysWidget birthdays={birthdays} />}
      </div>

      {/* Today's schedule */}
      <div className="mb-6 border border-border bg-card p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Heutiger Plan
        </p>
        {(data.todaySessions?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
        ) : (
          <ul className="space-y-2">
            {data.todaySessions?.map(s => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{s.class_types?.name ?? 'Session'}</span>
                <span className="font-mono text-muted-foreground">
                  {formatTime(s.starts_at)} · {s.confirmedCount}/{s.capacity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Charts row */}
      {insights && (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <UtilizationChart data={insights.utilizationTrend} />
            <TopClassesChart data={insights.topClasses} />
          </div>

          {/* Inactive members + Leads kanban */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <InactiveMembersWidget members={insights.inactiveMembers} />
            {data.leadsByStatus && <LeadsMiniKanban data={data.leadsByStatus} />}
          </div>

          {/* Revenue breakdown */}
          <RevenueWidget
            estimatedMonthlyRevenue={insights.estimatedMonthlyRevenue}
            activeMembers={insights.activeMembers}
            breakdown={insights.revenueBreakdown}
          />
        </>
      )}
    </div>
  )
}
```

### Step 3.2 — Run TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no errors

### Step 3.3 — Run full test suite

- [ ] Run: `npx vitest run`
- Expected: all tests PASS

### Step 3.4 — Verify in browser (dev server)

- [ ] Run: `npm run dev`
- [ ] Open `http://localhost:3000/admin/dashboard` on a mobile viewport (< 1024px)
- Expected:
  - No hamburger bar at the top
  - Bottom tab bar visible with role-appropriate tabs
  - Dashboard shows 4-card stat strip, then 3-card secondary metrics, then next class, then promotions/birthdays, then schedule, then charts
- [ ] Open on desktop (≥ 1024px)
- Expected:
  - Left sidebar with 5 labeled sections (OPS / Mitglieder / Business / Content / System) for owner
  - No bottom bar visible
  - No top hamburger bar

### Step 3.5 — Commit

- [ ] Run:
```bash
git add app/(admin)/admin/dashboard/page.tsx
git commit -m "feat: reorder dashboard layout mobile-first; add lead conversion, revenue delta, fill rate stat cards"
```
