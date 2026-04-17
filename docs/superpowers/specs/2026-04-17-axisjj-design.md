# AXISJJ Gym Management System — Design Spec
**Date:** 2026-04-17  
**Status:** Approved  
**Project:** AXIS Jiu-Jitsu Vienna (axisjj.at)

---

## 1. Project Overview

A full gym management platform for AXIS Jiu-Jitsu Vienna — a Brazilian Jiu-Jitsu academy in Wien led by Head Coach Shamsudin Baisarov (Black Belt, first Chechen BJJ black belt in Austria).

**Gym details:**
- Name: AXISJJ / AXIS Jiu-Jitsu Vienna
- Address: Strindberggasse 1 / R01, 1110 Wien
- Head Coach: Shamsudin Baisarov
- Instagram: @axisjj_at
- Classes: Gi, No-Gi, Fundamentals (White Belts), All Levels, Advanced (Blue+), Kids, Open Mat, S&C, Privates

**Goals:**
1. Professional public marketing site to convert visitors into trial signups
2. Member portal for class booking, belt tracking, and skills progress
3. Admin dashboard for coaches to manage members, classes, check-ins, and promotions

---

## 2. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui + Radix UI + lucide-react |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Email | Resend |
| Forms | React Hook Form + Zod |
| Data fetching | TanStack Query |
| Dates | date-fns |
| Hosting | Vercel |
| Payments | **Out of scope for now** (no Stripe) |

**Supabase project:** `https://serrkmokwxqkupugkxud.supabase.co`

---

## 3. Design System

**Colors:**
- Background: `#0a0a0a` (near-black)
- Surface: `#111111`, `#1a1a1a`
- Primary accent: `#dc2626` (brand red — matches logo)
- Text primary: `#ffffff`
- Text muted: `#9ca3af`, `#6b7280`
- Border: `#1a1a1a`, `#222222`

**Typography:** Inter (Google Fonts) — weights 400, 600, 700, 900  
**Language:** German primary, English secondary. Public site: German main text + English subtitle on hero/CTA headlines. Member portal: DE/EN toggle in `/members/konto`, preference stored in `profiles.language`.  
**Mode:** Dark only  
**Responsive:** Mobile-first

**Brand assets (provided by client) — stored in `public/images/`:**
- `logo.png` — Mountain-A mark + "AXIS JIU JITSU" wordmark + red square bar accent
- `hero-action.jpg` — BJJ grappling on red mat (hero background)
- `coach-banner.jpg` — Shamsudin Baisarov in black gi with red brush-stroke background
- `kids-bjj.jpg` — Kids competition gi photo (Programs section)
- `nogi-training.jpg` — Dark gym no-gi training photo (Programs section)

User-uploaded content (avatars) goes to Supabase Storage bucket `avatars`.

---

## 4. Architecture

**Approach:** Single Next.js 15 app with route groups (Approach A).  
**Routing:** Path-based (not subdomain) — one Vercel deployment.

### Folder Structure

```
axisjj/
├── app/
│   ├── (public)/                 # Marketing site
│   │   ├── layout.tsx            # Sticky nav + footer
│   │   ├── page.tsx              # Homepage
│   │   ├── trainingsplan/page.tsx
│   │   └── trial/page.tsx        # Trial signup form
│   ├── (members)/                # Member portal
│   │   ├── layout.tsx            # Sidebar + auth guard
│   │   ├── dashboard/page.tsx
│   │   ├── buchen/page.tsx
│   │   ├── skills/page.tsx
│   │   ├── gürtel/page.tsx
│   │   └── konto/page.tsx
│   ├── (admin)/                  # Admin dashboard
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── mitglieder/page.tsx
│   │   ├── klassen/page.tsx
│   │   ├── checkin/page.tsx
│   │   ├── promotions/page.tsx
│   │   └── leads/page.tsx
│   ├── api/                      # Route handlers
│   │   ├── checkin/route.ts
│   │   └── trial/route.ts
│   ├── login/page.tsx
│   └── layout.tsx                # Root (fonts, providers)
├── components/
│   ├── public/                   # Hero, ScheduleWidget, PricingCard, CoachSection
│   ├── members/                  # BookingCard, BeltProgress, SkillBar, WaitlistBadge
│   ├── admin/                    # DataTable, StatsCard, CheckInScanner, PromotionEngine
│   └── ui/                       # shadcn/ui base components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server component client
│   │   └── middleware.ts         # Middleware client
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useBooking.ts
│   │   └── useSkills.ts
│   └── utils/
│       ├── cn.ts                 # clsx + tailwind-merge
│       └── dates.ts              # date-fns helpers
├── middleware.ts                  # Route protection
└── supabase/
    └── migrations/               # SQL migration files
```

### Route Protection (middleware.ts)

- `/members/*` → redirect to `/login` if no session
- `/admin/*` → redirect to `/members/dashboard` if `profiles.role !== 'coach' && !== 'owner'`
- `/login` → redirect to `/members/dashboard` if already authenticated

---

## 5. Landing Page (Public Site)

Eight sections in order:

1. **Sticky Navigation** — Logo, Trainingsplan, Team, Preise links + "1 Woche Gratis" CTA button (red)
2. **Hero** — Full-viewport, action photo background, tagline "DISCIPLINE. TECHNIQUE. PROGRESS.", bilingual sub-copy, two CTAs: "1 WOCHE GRATIS →" + "STUNDENPLAN"
3. **Stats Bar** — 4 stats: Klassen/Woche, Gi+No-Gi, Black Belt coach, Kids welcome
4. **Interactive Schedule Widget** — Day tabs (Mo–So), list of classes per day with time + level + capacity indicator
5. **Coach Section** — Shamsudin Baisarov photo + bio (from provided banner), "Erster tschetschenischer BJJ-Schwarzgurt Österreichs"
6. **Programs Grid** — 2×2 card grid: Fundamentals, All Levels Gi, No-Gi, Kids BJJ (with photos)
7. **Trial CTA Block** — Full-width dark-red gradient block: "1 Woche kostenlos testen · Keine Anmeldegebühr" + signup button → `/trial`
8. **Footer** — Address, Instagram link, Impressum, Datenschutz, copyright

---

## 6. Database Schema

### Tables

**profiles**
```sql
id uuid PK (→ auth.users.id)
full_name text NOT NULL
email text NOT NULL
phone text
date_of_birth date
role text DEFAULT 'member'  -- 'member' | 'coach' | 'owner'
avatar_url text
language text DEFAULT 'de'  -- 'de' | 'en'
created_at timestamptz DEFAULT now()
```

**belt_ranks**
```sql
id uuid PK
name text NOT NULL          -- 'White', 'Blue', 'Purple', 'Brown', 'Black'
stripes int DEFAULT 0       -- 0–4
order int NOT NULL
min_time_months int
min_sessions int
color_hex text
```

**profile_ranks**
```sql
id uuid PK
profile_id uuid → profiles.id
belt_rank_id uuid → belt_ranks.id
promoted_at date NOT NULL
promoted_by uuid → profiles.id
notes text
```

**class_types**
```sql
id uuid PK
name text NOT NULL
description text
level text  -- 'beginner' | 'all' | 'advanced' | 'kids'
gi boolean DEFAULT true
```

**class_sessions**
```sql
id uuid PK
class_type_id uuid → class_types.id
coach_id uuid → profiles.id
starts_at timestamptz NOT NULL
ends_at timestamptz NOT NULL
capacity int DEFAULT 20
location text DEFAULT 'Strindberggasse 1, 1110 Wien'
recurring_group_id uuid
cancelled boolean DEFAULT false
```

**bookings**
```sql
id uuid PK
session_id uuid → class_sessions.id
profile_id uuid → profiles.id
status text DEFAULT 'confirmed'  -- 'confirmed' | 'waitlisted' | 'cancelled'
booked_at timestamptz DEFAULT now()
waitlist_position int  -- NULL if confirmed
```

**attendances**
```sql
id uuid PK
session_id uuid → class_sessions.id
profile_id uuid → profiles.id
checked_in_at timestamptz DEFAULT now()
checked_in_by uuid → profiles.id
```

**skill_categories**
```sql
id uuid PK
name text NOT NULL  -- 'Guard', 'Passing', 'Submissions', 'Takedowns', 'Escapes'
order int NOT NULL
```

**skills**
```sql
id uuid PK
category_id uuid → skill_categories.id
name text NOT NULL
description text
video_url text
belt_rank_id uuid → belt_ranks.id
order int NOT NULL
```

**skill_progress**
```sql
id uuid PK
profile_id uuid → profiles.id
skill_id uuid → skills.id
status text DEFAULT 'not_started'  -- 'not_started' | 'in_progress' | 'mastered'
updated_at timestamptz DEFAULT now()
UNIQUE(profile_id, skill_id)
```

**leads**
```sql
id uuid PK
full_name text NOT NULL
email text NOT NULL
phone text
message text
source text DEFAULT 'website'  -- 'website' | 'instagram'
status text DEFAULT 'new'      -- 'new' | 'contacted' | 'converted' | 'lost'
created_at timestamptz DEFAULT now()
```

**documents**
```sql
id uuid PK
profile_id uuid → profiles.id
type text NOT NULL  -- 'waiver' | 'contract'
signed_at timestamptz
content_url text
```

### RLS Strategy
- Members: read/write own rows only (`auth.uid() = profile_id`)
- Coaches: read all profiles, sessions, bookings, attendances
- Owner: full access to all tables
- Public: read `class_sessions`, `class_types` (for schedule widget)

---

## 7. Member Portal

| Route | Description |
|---|---|
| `/members/dashboard` | Next class countdown, attendance streak, belt progress ring, quick-book CTA |
| `/members/buchen` | Weekly grid → book/cancel/waitlist. Shows capacity (e.g. "8/12"). On cancellation, a DB trigger promotes the first waitlisted booking to `confirmed`, decrements remaining `waitlist_position` values, and sends a Resend notification email. |
| `/members/skills` | Skills library by category, progress bar per skill, video links |
| `/members/gürtel` | Current belt + stripes, time-in-grade, sessions attended, promotion readiness %. Formula: `min(100, (sessions_attended / min_sessions × 50) + (months_in_grade / min_time_months × 50))` |
| `/members/konto` | Profile edit, signed waivers, language toggle DE/EN |

---

## 8. Admin Dashboard

| Route | Description |
|---|---|
| `/admin/dashboard` | Today's classes, check-ins count, new leads, active members summary |
| `/admin/mitglieder` | Member list, filter by belt/status, search by name |
| `/admin/klassen` | Create/edit recurring sessions, set capacity and coach |
| `/admin/checkin` | QR scanner + manual check-in for today's sessions |
| `/admin/promotions` | Belt promotion engine: eligibility list, one-click promote |
| `/admin/leads` | Trial pipeline: New → Contacted → Converted |

---

## 9. Auth Flow

1. User visits `/trial` → fills name, email, phone → `leads` row created → Resend welcome email sent
2. Admin converts lead → creates Supabase auth user → member receives magic link
3. First login → profile completion form
4. Subsequent logins: email/password or magic link
5. Middleware enforces role-based access

---

## 10. Implementation Phases

| Phase | Scope |
|---|---|
| **1** | Project setup, Supabase schema + RLS, landing page (all 8 sections) |
| **2** | Auth (login, magic link), trial form, member dashboard + booking |
| **3** | Belt tracking, skills library, waitlist logic |
| **4** | Admin dashboard: members, classes, check-in, promotions, leads |
| **5** | Polish: email templates, SEO metadata, mobile QA, Vercel deploy |

---

## 11. Out of Scope (for now)

- Stripe / payment processing
- Family/parent accounts
- Gated video content
- Mass email campaigns
- SEPA direct debit
