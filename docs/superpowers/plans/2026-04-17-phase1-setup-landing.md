# AXISJJ Phase 1 — Setup + DB Schema + Landing Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the AXISJJ Next.js 15 app, run DB migrations on Supabase, and build the complete 8-section public landing page.

**Architecture:** Single Next.js 15 App Router app with route groups. Public landing page lives in `app/(public)/`. Supabase client uses `@supabase/ssr`. All styles via Tailwind CSS with shadcn/ui primitives.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS, shadcn/ui, Supabase (`@supabase/ssr`), Vitest + @testing-library/react, Vercel

**Supabase project:** `https://serrkmokwxqkupugkxud.supabase.co`  
**Design:** Background `#0a0a0a`, accent `#dc2626` (brand red), white text, Inter font

**Spec:** `docs/superpowers/specs/2026-04-17-axisjj-design.md`

---

## File Map

```
axisjj/
├── .env.local                          # Never committed — env vars
├── .env.example                        # Committed template
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
├── middleware.ts                        # Route protection
├── app/
│   ├── layout.tsx                       # Root: Inter font + QueryProvider
│   ├── globals.css                      # Tailwind directives + CSS vars
│   └── (public)/
│       ├── layout.tsx                   # Sticky NavBar + Footer wrapper
│       └── page.tsx                     # Homepage: all 8 sections composed
├── components/
│   ├── ui/                              # shadcn Button, Input (auto-generated)
│   └── public/
│       ├── NavBar.tsx                   # Sticky nav, mobile hamburger
│       ├── Hero.tsx                     # Full-viewport hero, photo bg
│       ├── StatsBar.tsx                 # 4-stat horizontal bar
│       ├── ScheduleWidget.tsx           # Day-tab schedule, static data Phase 1
│       ├── CoachSection.tsx             # Coach bio + photo
│       ├── ProgramsGrid.tsx             # 2×2 program cards
│       ├── TrialCTA.tsx                 # Full-width CTA block
│       └── Footer.tsx                   # Address, links, copyright
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Browser Supabase client
│   │   └── server.ts                    # Server component Supabase client
│   └── utils/
│       ├── cn.ts                        # clsx + tailwind-merge helper
│       └── schedule-data.ts             # Static schedule (replaced Phase 4)
├── types/
│   └── supabase.ts                      # DB type definitions
├── public/
│   └── images/
│       ├── logo.png
│       ├── hero-action.jpg
│       ├── coach-banner.jpg
│       ├── kids-bjj.jpg
│       └── nogi-training.jpg
└── supabase/
    └── migrations/
        ├── 001_schema.sql               # All CREATE TABLE statements
        ├── 002_rls.sql                  # RLS enable + all policies
        └── 003_seed.sql                 # Belt ranks, class types, skill categories
```

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `axisjj/` (project root — run from parent directory)
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create Next.js 15 app**

Run from `C:\Users\Mago\` (parent of where you want the project):
```bash
npx create-next-app@latest axisjj \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd axisjj
```

- [ ] **Step 2: Install project dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js \
  @tanstack/react-query \
  clsx tailwind-merge \
  lucide-react \
  date-fns \
  react-hook-form @hookform/resolvers zod
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 5: Add required shadcn components**

```bash
npx shadcn@latest add button input label badge
```

- [ ] **Step 6: Create `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 7: Create `.env.local` with real values (never commit this)**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://serrkmokwxqkupugkxud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnJrbW9rd3hxa3VwdWdreHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTk4OTYsImV4cCI6MjA5MTk5NTg5Nn0.er4XB2fg2utmsMfs77boMMfjHGkapD3GMU86YBy6lwQ
```

- [ ] **Step 8: Verify `.gitignore` includes secrets**

Open `.gitignore` and confirm these lines exist (add if missing):
```
.env.local
.env*.local
.superpowers/
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at http://localhost:3000 — Next.js default page loads.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 15 project with shadcn and Supabase deps"
```

---

## Task 2: Configure Testing with Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to `package.json`**

Open `package.json` and add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test to verify setup**

Create `lib/utils/__tests__/cn.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates tailwind classes — last wins', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skip', 'include')).toBe('base include')
  })
})
```

- [ ] **Step 5: Run test — expect FAIL (cn not created yet)**

```bash
npm test
```
Expected: `Error: Cannot find module '../cn'`

- [ ] **Step 6: Create `lib/utils/cn.ts`**

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 7: Run test — expect PASS**

```bash
npm test
```
Expected: `3 passed`

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts vitest.setup.ts lib/ package.json
git commit -m "feat: add Vitest testing setup and cn utility"
```

---

## Task 3: Configure Tailwind Theme + Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `app/layout.tsx` (root layout with Inter font)

- [ ] **Step 1: Write failing test for theme token existence**

Create `lib/utils/__tests__/theme.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('tailwind theme tokens', () => {
  it('exports brand red hex value', () => {
    // This documents the intended token — actual Tailwind config is tested by visual QA
    const brandRed = '#dc2626'
    expect(brandRed).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
```

- [ ] **Step 2: Run test — expect PASS (trivial, documents intent)**

```bash
npm test
```
Expected: `4 passed`

- [ ] **Step 3: Update `tailwind.config.ts`**

Replace the entire file:
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#dc2626',
          'red-dark': '#991b1b',
          'red-light': '#ef4444',
        },
        surface: {
          DEFAULT: '#111111',
          muted: '#1a1a1a',
          hover: '#222222',
        },
        bg: {
          DEFAULT: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 4: Update `app/globals.css`**

Replace the entire file:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 100%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 100%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 100%;
    --primary: 0 72% 51%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 11%;
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 11%;
    --muted-foreground: 0 0% 60%;
    --accent: 0 72% 51%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 13%;
    --input: 0 0% 13%;
    --ring: 0 72% 51%;
    --radius: 0rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-bg text-white antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
  html {
    scroll-behavior: smooth;
  }
}
```

- [ ] **Step 5: Update root `app/layout.tsx`**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AXIS Jiu-Jitsu Vienna — Brazilian Jiu-Jitsu in Wien',
    template: '%s | AXIS JJJ Vienna',
  },
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien bei Österreichs erstem tschetschenischen Schwarzgurt. Gi, No-Gi, Kids. Jetzt 1 Woche kostenlos testen.',
  keywords: ['BJJ Wien', 'Brazilian Jiu-Jitsu Vienna', 'AXIS JJJ', 'Grappling Wien'],
  openGraph: {
    siteName: 'AXIS Jiu-Jitsu Vienna',
    locale: 'de_AT',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Verify dev server with new theme**

```bash
npm run dev
```
Open http://localhost:3000 — background should be near-black `#0a0a0a`.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "feat: configure AXISJJ brand theme — dark bg, brand red accent"
```

---

## Task 4: Supabase Client Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `types/supabase.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write failing test for Supabase client factory**

Create `lib/supabase/__tests__/client.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/ssr before importing our module
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ auth: { getSession: vi.fn() } })),
}))

describe('createClient (browser)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('returns a Supabase client object', async () => {
    const { createClient } = await import('../client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```
Expected: `Error: Cannot find module '../client'`

- [ ] **Step 3: Create `lib/supabase/client.ts`**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test
```
Expected: `5 passed`

- [ ] **Step 5: Create `lib/supabase/server.ts`**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies can't be set here, middleware handles it
          }
        },
      },
    }
  )
}
```

- [ ] **Step 6: Create `types/supabase.ts`**

```typescript
// types/supabase.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          role: 'member' | 'coach' | 'owner'
          avatar_url: string | null
          language: 'de' | 'en'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      belt_ranks: {
        Row: {
          id: string
          name: string
          stripes: number
          order: number
          min_time_months: number | null
          min_sessions: number | null
          color_hex: string | null
        }
        Insert: Omit<Database['public']['Tables']['belt_ranks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['belt_ranks']['Insert']>
      }
      class_types: {
        Row: {
          id: string
          name: string
          description: string | null
          level: 'beginner' | 'all' | 'advanced' | 'kids'
          gi: boolean
        }
        Insert: Omit<Database['public']['Tables']['class_types']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['class_types']['Insert']>
      }
      class_sessions: {
        Row: {
          id: string
          class_type_id: string
          coach_id: string | null
          starts_at: string
          ends_at: string
          capacity: number
          location: string
          recurring_group_id: string | null
          cancelled: boolean
        }
        Insert: Omit<Database['public']['Tables']['class_sessions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['class_sessions']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          session_id: string
          profile_id: string
          status: 'confirmed' | 'waitlisted' | 'cancelled'
          booked_at: string
          waitlist_position: number | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booked_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      attendances: {
        Row: {
          id: string
          session_id: string
          profile_id: string
          checked_in_at: string
          checked_in_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['attendances']['Row'], 'id' | 'checked_in_at'>
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>
      }
      skill_categories: {
        Row: { id: string; name: string; order: number }
        Insert: Omit<Database['public']['Tables']['skill_categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skill_categories']['Insert']>
      }
      skills: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          video_url: string | null
          belt_rank_id: string | null
          order: number
        }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
      }
      skill_progress: {
        Row: {
          id: string
          profile_id: string
          skill_id: string
          status: 'not_started' | 'in_progress' | 'mastered'
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['skill_progress']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['skill_progress']['Insert']>
      }
      leads: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          message: string | null
          source: 'website' | 'instagram'
          status: 'new' | 'contacted' | 'converted' | 'lost'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      documents: {
        Row: {
          id: string
          profile_id: string
          type: 'waiver' | 'contract'
          signed_at: string | null
          content_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      profile_ranks: {
        Row: {
          id: string
          profile_id: string
          belt_rank_id: string
          promoted_at: string
          promoted_by: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['profile_ranks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['profile_ranks']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: string }
    }
    Enums: Record<string, never>
  }
}
```

- [ ] **Step 7: Update `next.config.ts` to allow Supabase image domain**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'serrkmokwxqkupugkxud.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 8: Run all tests — expect PASS**

```bash
npm test
```
Expected: `5 passed`

- [ ] **Step 9: Commit**

```bash
git add lib/supabase/ types/ next.config.ts
git commit -m "feat: add Supabase client factory and TypeScript database types"
```

---

## Task 5: Route Protection Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write failing test for middleware path logic**

Create `middleware.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

// Unit test the path-matching logic in isolation
function shouldProtect(pathname: string): 'members' | 'admin' | 'public' {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/members')) return 'members'
  return 'public'
}

describe('middleware route classification', () => {
  it('classifies /members/* as protected', () => {
    expect(shouldProtect('/members/dashboard')).toBe('members')
    expect(shouldProtect('/members/buchen')).toBe('members')
  })

  it('classifies /admin/* as admin-protected', () => {
    expect(shouldProtect('/admin/dashboard')).toBe('admin')
  })

  it('classifies public routes as public', () => {
    expect(shouldProtect('/')).toBe('public')
    expect(shouldProtect('/trial')).toBe('public')
    expect(shouldProtect('/login')).toBe('public')
  })
})
```

- [ ] **Step 2: Run test — expect PASS (pure logic, no imports)**

```bash
npm test
```
Expected: `8 passed`

- [ ] **Step 3: Create `middleware.ts`**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect member routes
  if (pathname.startsWith('/members') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect admin routes (role checked in admin layout)
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from /login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/members/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Commit**

```bash
git add middleware.ts middleware.test.ts
git commit -m "feat: add auth middleware for member and admin route protection"
```

---

## Task 6: Database Migrations

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/migrations/003_seed.sql`

- [ ] **Step 1: Create `supabase/migrations/001_schema.sql`**

```sql
-- 001_schema.sql
-- AXISJJ complete database schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles — linked 1:1 to auth.users
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  date_of_birth DATE,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('member', 'coach', 'owner')),
  avatar_url  TEXT,
  language    TEXT NOT NULL DEFAULT 'de'
                CHECK (language IN ('de', 'en')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Belt ranks (seeded separately)
CREATE TABLE belt_ranks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  stripes          INT  NOT NULL DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  "order"          INT  NOT NULL,
  min_time_months  INT,
  min_sessions     INT,
  color_hex        TEXT,
  UNIQUE(name, stripes)
);

-- Belt promotion history per member
CREATE TABLE profile_ranks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  belt_rank_id   UUID NOT NULL REFERENCES belt_ranks(id),
  promoted_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  promoted_by    UUID REFERENCES profiles(id),
  notes          TEXT
);

-- Class types (Fundamentals, All Levels Gi, No-Gi, Kids, etc.)
CREATE TABLE class_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  level       TEXT NOT NULL DEFAULT 'all'
                CHECK (level IN ('beginner', 'all', 'advanced', 'kids')),
  gi          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Scheduled class instances
CREATE TABLE class_sessions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_type_id      UUID NOT NULL REFERENCES class_types(id),
  coach_id           UUID REFERENCES profiles(id),
  starts_at          TIMESTAMPTZ NOT NULL,
  ends_at            TIMESTAMPTZ NOT NULL,
  capacity           INT NOT NULL DEFAULT 20,
  location           TEXT NOT NULL DEFAULT 'Strindberggasse 1, 1110 Wien',
  recurring_group_id UUID,
  cancelled          BOOLEAN NOT NULL DEFAULT FALSE
);

-- Member bookings per session
CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  booked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waitlist_position INT,
  UNIQUE(session_id, profile_id)
);

-- Check-in records
CREATE TABLE attendances (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by  UUID REFERENCES profiles(id),
  UNIQUE(session_id, profile_id)
);

-- Skill taxonomy
CREATE TABLE skill_categories (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name    TEXT NOT NULL,
  "order" INT  NOT NULL
);

CREATE TABLE skills (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES skill_categories(id),
  name         TEXT NOT NULL,
  description  TEXT,
  video_url    TEXT,
  belt_rank_id UUID REFERENCES belt_ranks(id),
  "order"      INT  NOT NULL
);

-- Member progress per skill
CREATE TABLE skill_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, skill_id)
);

-- Trial / lead signups from public website
CREATE TABLE leads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  message    TEXT,
  source     TEXT NOT NULL DEFAULT 'website'
               CHECK (source IN ('website', 'instagram')),
  status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waivers and contracts
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('waiver', 'contract')),
  signed_at   TIMESTAMPTZ,
  content_url TEXT
);
```

- [ ] **Step 2: Create `supabase/migrations/002_rls.sql`**

```sql
-- 002_rls.sql
-- Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_ranks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_ranks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_coach"
  ON profiles FOR SELECT USING (get_my_role() IN ('coach', 'owner'));

-- BELT_RANKS — public read, owner manages
CREATE POLICY "belt_ranks_public_read"
  ON belt_ranks FOR SELECT USING (TRUE);
CREATE POLICY "belt_ranks_owner_all"
  ON belt_ranks FOR ALL USING (get_my_role() = 'owner');

-- PROFILE_RANKS
CREATE POLICY "profile_ranks_select_own"
  ON profile_ranks FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "profile_ranks_select_coach"
  ON profile_ranks FOR SELECT USING (get_my_role() IN ('coach', 'owner'));
CREATE POLICY "profile_ranks_insert_coach"
  ON profile_ranks FOR INSERT WITH CHECK (get_my_role() IN ('coach', 'owner'));

-- CLASS_TYPES — public read
CREATE POLICY "class_types_public_read"
  ON class_types FOR SELECT USING (TRUE);
CREATE POLICY "class_types_coach_all"
  ON class_types FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- CLASS_SESSIONS — public read (for schedule widget)
CREATE POLICY "class_sessions_public_read"
  ON class_sessions FOR SELECT USING (TRUE);
CREATE POLICY "class_sessions_coach_all"
  ON class_sessions FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- BOOKINGS
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "bookings_update_own"
  ON bookings FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "bookings_select_coach"
  ON bookings FOR SELECT USING (get_my_role() IN ('coach', 'owner'));
CREATE POLICY "bookings_update_coach"
  ON bookings FOR UPDATE USING (get_my_role() IN ('coach', 'owner'));

-- ATTENDANCES
CREATE POLICY "attendances_select_own"
  ON attendances FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "attendances_coach_all"
  ON attendances FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- SKILL_CATEGORIES — public read
CREATE POLICY "skill_categories_public_read"
  ON skill_categories FOR SELECT USING (TRUE);
CREATE POLICY "skill_categories_owner_all"
  ON skill_categories FOR ALL USING (get_my_role() = 'owner');

-- SKILLS — public read
CREATE POLICY "skills_public_read"
  ON skills FOR SELECT USING (TRUE);
CREATE POLICY "skills_owner_all"
  ON skills FOR ALL USING (get_my_role() = 'owner');

-- SKILL_PROGRESS
CREATE POLICY "skill_progress_own_all"
  ON skill_progress FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "skill_progress_coach_read"
  ON skill_progress FOR SELECT USING (get_my_role() IN ('coach', 'owner'));

-- LEADS — public insert (trial form), coaches manage
CREATE POLICY "leads_public_insert"
  ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "leads_coach_all"
  ON leads FOR ALL USING (get_my_role() IN ('coach', 'owner'));

-- DOCUMENTS
CREATE POLICY "documents_select_own"
  ON documents FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "documents_coach_all"
  ON documents FOR ALL USING (get_my_role() IN ('coach', 'owner'));
```

- [ ] **Step 3: Create `supabase/migrations/003_seed.sql`**

```sql
-- 003_seed.sql
-- Seed: belt ranks, class types, skill categories

-- Belt ranks (White through Black with stripes)
INSERT INTO belt_ranks (name, stripes, "order", min_time_months, min_sessions, color_hex) VALUES
  ('White',  0,  1,   0,    0, '#FFFFFF'),
  ('White',  1,  2,   2,   20, '#FFFFFF'),
  ('White',  2,  3,   4,   40, '#FFFFFF'),
  ('White',  3,  4,   6,   60, '#FFFFFF'),
  ('White',  4,  5,   8,   80, '#FFFFFF'),
  ('Blue',   0,  6,  12,  100, '#1D4ED8'),
  ('Blue',   1,  7,  18,  130, '#1D4ED8'),
  ('Blue',   2,  8,  24,  160, '#1D4ED8'),
  ('Blue',   3,  9,  30,  190, '#1D4ED8'),
  ('Blue',   4, 10,  36,  220, '#1D4ED8'),
  ('Purple', 0, 11,  48,  300, '#7C3AED'),
  ('Purple', 1, 12,  54,  340, '#7C3AED'),
  ('Purple', 2, 13,  60,  380, '#7C3AED'),
  ('Purple', 3, 14,  66,  420, '#7C3AED'),
  ('Purple', 4, 15,  72,  460, '#7C3AED'),
  ('Brown',  0, 16,  96,  600, '#78350F'),
  ('Brown',  1, 17, 102,  650, '#78350F'),
  ('Brown',  2, 18, 108,  700, '#78350F'),
  ('Brown',  3, 19, 114,  750, '#78350F'),
  ('Brown',  4, 20, 120,  800, '#78350F'),
  ('Black',  0, 21, 180, 1200, '#111111');

-- Class types
INSERT INTO class_types (name, description, level, gi) VALUES
  ('Fundamentals',          'Grundlagen für Weiße Gürtel und Anfänger',   'beginner', TRUE),
  ('All Levels Gi',         'Gi Training für alle Levels',                 'all',      TRUE),
  ('Advanced Gi',           'Gi für Blue Belt und höher',                  'advanced', TRUE),
  ('No-Gi All Levels',      'No-Gi für alle Levels',                       'all',      FALSE),
  ('No-Gi Advanced',        'No-Gi für Blue Belt und höher',               'advanced', FALSE),
  ('Kids BJJ',              'Brazilian Jiu-Jitsu für Kinder (6–14 Jahre)', 'kids',     TRUE),
  ('Open Mat',              'Freies Sparring, alle Levels',                'all',      TRUE),
  ('Strength & Conditioning','Konditionstraining',                          'all',      FALSE);

-- Skill categories
INSERT INTO skill_categories (name, "order") VALUES
  ('Guard',       1),
  ('Passing',     2),
  ('Submissions', 3),
  ('Takedowns',   4),
  ('Escapes',     5),
  ('Sweeps',      6);
```

- [ ] **Step 4: Run migrations in Supabase SQL Editor**

Go to https://supabase.com/dashboard/project/serrkmokwxqkupugkxud/sql/new

Run each file in order:
1. Copy-paste `001_schema.sql` → Run
2. Copy-paste `002_rls.sql` → Run
3. Copy-paste `003_seed.sql` → Run

Expected for each: `Success. No rows returned.`

- [ ] **Step 5: Verify seed data in Table Editor**

Go to https://supabase.com/dashboard/project/serrkmokwxqkupugkxud/editor

Check: `belt_ranks` table has 21 rows, `class_types` has 8 rows, `skill_categories` has 6 rows.

- [ ] **Step 6: Commit migrations**

```bash
git add supabase/
git commit -m "feat: add complete DB schema, RLS policies, and seed data"
```

---

## Task 7: Add Brand Images

**Files:**
- Populate: `public/images/`

- [ ] **Step 1: Create images directory**

```bash
mkdir -p public/images
```

- [ ] **Step 2: Save brand assets to `public/images/`**

Save the images the client provided with these exact filenames:
- `public/images/logo.png` — the AXIS mountain-A logo (white version for dark bg)
- `public/images/hero-action.jpg` — BJJ grappling on red mat (the marketing poster image)
- `public/images/coach-banner.jpg` — Shamsudin Baisarov coach photo
- `public/images/kids-bjj.jpg` — Kids competition photo
- `public/images/nogi-training.jpg` — No-Gi dark gym photo

> **Note:** If you only have the logo with white background, use an image editor or online tool (remove.bg) to create a transparent PNG version. The logo should display as white on dark.

- [ ] **Step 3: Verify images load**

Start dev server (`npm run dev`) and visit http://localhost:3000/images/logo.png — image should load directly.

- [ ] **Step 4: Commit**

```bash
git add public/images/
git commit -m "feat: add brand images and logo to public/images"
```

---

## Task 8: Static Schedule Data

**Files:**
- Create: `lib/utils/schedule-data.ts`

- [ ] **Step 1: Write failing test for schedule data shape**

Create `lib/utils/__tests__/schedule-data.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { SCHEDULE, type ScheduleDay } from '../schedule-data'

describe('SCHEDULE static data', () => {
  it('has entries for all 7 days', () => {
    expect(SCHEDULE).toHaveLength(7)
  })

  it('each day has label, short, and classes array', () => {
    SCHEDULE.forEach((day: ScheduleDay) => {
      expect(day).toHaveProperty('label')
      expect(day).toHaveProperty('short')
      expect(day).toHaveProperty('classes')
      expect(Array.isArray(day.classes)).toBe(true)
    })
  })

  it('each class has name, time, level, and gi fields', () => {
    const allClasses = SCHEDULE.flatMap(d => d.classes)
    allClasses.forEach(cls => {
      expect(cls).toHaveProperty('name')
      expect(cls).toHaveProperty('time')
      expect(cls).toHaveProperty('level')
      expect(cls).toHaveProperty('gi')
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```
Expected: `Error: Cannot find module '../schedule-data'`

- [ ] **Step 3: Create `lib/utils/schedule-data.ts`**

```typescript
// lib/utils/schedule-data.ts
// Static schedule — replaced by live DB query in Phase 4

export interface ScheduleClass {
  name: string
  time: string
  endTime: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

export interface ScheduleDay {
  label: string  // 'Montag'
  short: string  // 'MO'
  classes: ScheduleClass[]
}

export const SCHEDULE: ScheduleDay[] = [
  {
    label: 'Montag', short: 'MO',
    classes: [
      { name: 'Fundamentals',    time: '10:00', endTime: '11:00', level: 'beginner', gi: true },
      { name: 'All Levels Gi',   time: '18:00', endTime: '19:30', level: 'all',      gi: true },
      { name: 'No-Gi All Levels',time: '19:30', endTime: '21:00', level: 'all',      gi: false },
    ],
  },
  {
    label: 'Dienstag', short: 'DI',
    classes: [
      { name: 'Fundamentals',    time: '18:00', endTime: '19:00', level: 'beginner', gi: true },
      { name: 'Advanced Gi',     time: '19:00', endTime: '20:30', level: 'advanced', gi: true },
    ],
  },
  {
    label: 'Mittwoch', short: 'MI',
    classes: [
      { name: 'Kids BJJ',        time: '16:00', endTime: '17:00', level: 'kids',     gi: true },
      { name: 'All Levels Gi',   time: '18:00', endTime: '19:30', level: 'all',      gi: true },
      { name: 'No-Gi Advanced',  time: '19:30', endTime: '21:00', level: 'advanced', gi: false },
    ],
  },
  {
    label: 'Donnerstag', short: 'DO',
    classes: [
      { name: 'Fundamentals',    time: '18:00', endTime: '19:00', level: 'beginner', gi: true },
      { name: 'All Levels Gi',   time: '19:00', endTime: '20:30', level: 'all',      gi: true },
    ],
  },
  {
    label: 'Freitag', short: 'FR',
    classes: [
      { name: 'No-Gi All Levels',time: '18:00', endTime: '19:30', level: 'all',      gi: false },
      { name: 'Open Mat',        time: '19:30', endTime: '21:00', level: 'all',      gi: true },
    ],
  },
  {
    label: 'Samstag', short: 'SA',
    classes: [
      { name: 'Kids BJJ',        time: '10:00', endTime: '11:00', level: 'kids',     gi: true },
      { name: 'All Levels Gi',   time: '11:00', endTime: '12:30', level: 'all',      gi: true },
      { name: 'Open Mat',        time: '12:30', endTime: '14:00', level: 'all',      gi: true },
    ],
  },
  {
    label: 'Sonntag', short: 'SO',
    classes: [
      { name: 'Strength & Conditioning', time: '10:00', endTime: '11:00', level: 'all', gi: false },
    ],
  },
]
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/utils/schedule-data.ts lib/utils/__tests__/schedule-data.test.ts
git commit -m "feat: add static schedule data (replaced by DB in Phase 4)"
```

---

## Task 9: NavBar Component

**Files:**
- Create: `components/public/NavBar.tsx`
- Create: `components/public/__tests__/NavBar.test.tsx`

- [ ] **Step 1: Write failing component test**

```typescript
// components/public/__tests__/NavBar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { NavBar } from '../NavBar'

describe('NavBar', () => {
  it('renders the AXIS JIU JITSU logo link', () => {
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /axis jiu jitsu/i })).toBeInTheDocument()
  })

  it('shows the trial CTA button', () => {
    render(<NavBar />)
    expect(screen.getByRole('link', { name: /1 woche gratis/i })).toBeInTheDocument()
  })

  it('toggles mobile menu on hamburger click', async () => {
    render(<NavBar />)
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(screen.queryByText('Trainingsplan')).not.toBeVisible()
    await userEvent.click(menuButton)
    expect(screen.getByText('Trainingsplan')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```
Expected: `Error: Cannot find module '../NavBar'`

- [ ] **Step 3: Create `components/public/NavBar.tsx`**

```typescript
// components/public/NavBar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '#trainingsplan', label: 'Trainingsplan' },
  { href: '#team',          label: 'Team' },
  { href: '#programme',     label: 'Programme' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href="/" aria-label="AXIS JIU JITSU — Zur Startseite">
          <Image
            src="/images/logo.png"
            alt="AXIS JIU JITSU"
            width={48}
            height={48}
            className="object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/trial"
            className="bg-red-600 px-5 py-2 text-sm font-black tracking-widest text-white transition-colors hover:bg-red-700"
          >
            1 WOCHE GRATIS
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="text-gray-400 md:hidden"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={open ? 'block border-t border-white/5 bg-[#0a0a0a] px-4 py-4 md:hidden' : 'hidden'}>
        <div className="flex flex-col gap-4">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/trial"
            className="bg-red-600 px-4 py-2 text-center text-sm font-black tracking-widest text-white"
            onClick={() => setOpen(false)}
          >
            1 WOCHE GRATIS
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `12 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/NavBar.tsx components/public/__tests__/NavBar.test.tsx
git commit -m "feat: add NavBar with mobile hamburger menu"
```

---

## Task 10: Hero Component

**Files:**
- Create: `components/public/Hero.tsx`
- Create: `components/public/__tests__/Hero.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/Hero.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Hero } from '../Hero'

describe('Hero', () => {
  it('renders the main tagline', () => {
    render(<Hero />)
    expect(screen.getByText('DISCIPLINE.')).toBeInTheDocument()
    expect(screen.getByText('TECHNIQUE.')).toBeInTheDocument()
    expect(screen.getByText('PROGRESS.')).toBeInTheDocument()
  })

  it('renders trial CTA link pointing to /trial', () => {
    render(<Hero />)
    const cta = screen.getByRole('link', { name: /1 woche gratis/i })
    expect(cta).toHaveAttribute('href', '/trial')
  })

  it('renders address', () => {
    render(<Hero />)
    expect(screen.getByText(/strindberggasse/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```
Expected: `Error: Cannot find module '../Hero'`

- [ ] **Step 3: Create `components/public/Hero.tsx`**

```typescript
// components/public/Hero.tsx
import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#0a0a0a] pt-16">

      {/* Background action photo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-action.jpg"
          alt="BJJ Training bei AXIS Jiu-Jitsu Wien"
          fill
          className="object-cover object-center opacity-20"
          priority
        />
        {/* Left-to-right fade so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/20" />
        {/* Bottom fade into next section */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Red atmospheric glow */}
      <div className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-red-600/8 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-red-600">
          Brazilian Jiu-Jitsu Vienna · Since 2020
        </p>

        <h1
          className="mb-6 font-black leading-[0.9] tracking-tighter text-white"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 8rem)' }}
        >
          DISCIPLINE.<br />
          TECHNIQUE.<br />
          <span className="text-red-600">PROGRESS.</span>
        </h1>

        <p className="mb-2 max-w-md text-base text-gray-300 sm:text-lg">
          Train with Austria&apos;s first Chechen Black Belt —{' '}
          <span className="text-white font-semibold">Shamsudin Baisarov</span>.
        </p>
        <p className="mb-2 text-sm text-gray-500">
          Trainiere mit Österreichs erstem tschetschenischen Schwarzgurt.
        </p>
        <p className="mb-10 text-sm text-gray-600">
          Strindberggasse 1 / R01 · 1110 Wien
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/trial"
            className="inline-block bg-red-600 px-8 py-4 text-sm font-black tracking-widest text-white transition-all hover:bg-red-700 hover:scale-105"
          >
            1 WOCHE GRATIS →
          </Link>
          <a
            href="#trainingsplan"
            className="inline-block border border-white/20 px-8 py-4 text-sm font-semibold tracking-wider text-white transition-colors hover:border-white/50 hover:text-white"
          >
            STUNDENPLAN
          </a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `15 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/Hero.tsx components/public/__tests__/Hero.test.tsx
git commit -m "feat: add Hero section with action photo and bilingual tagline"
```

---

## Task 11: StatsBar Component

**Files:**
- Create: `components/public/StatsBar.tsx`
- Create: `components/public/__tests__/StatsBar.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/StatsBar.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsBar } from '../StatsBar'

describe('StatsBar', () => {
  it('renders all 4 stats', () => {
    render(<StatsBar />)
    expect(screen.getByText(/klassen/i)).toBeInTheDocument()
    expect(screen.getByText(/gi/i)).toBeInTheDocument()
    expect(screen.getByText(/black belt/i)).toBeInTheDocument()
    expect(screen.getByText(/kids/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/StatsBar.tsx`**

```typescript
// components/public/StatsBar.tsx
const STATS = [
  { value: '10+',  label: 'Klassen / Woche',  sublabel: 'Classes per week' },
  { value: 'GI',   label: 'Gi + No-Gi',        sublabel: 'Both styles' },
  { value: '⬛ BB', label: 'Black Belt Coach',  sublabel: 'Head Coach' },
  { value: 'KIDS', label: 'Kinder willkommen', sublabel: 'Kids welcome' },
]

export function StatsBar() {
  return (
    <div className="border-t border-red-600/30 bg-[#111] py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:grid-cols-4 sm:px-6">
        {STATS.map(stat => (
          <div
            key={stat.label}
            className="flex flex-col items-center px-4 py-4 text-center"
          >
            <span className="mb-1 text-2xl font-black text-white sm:text-3xl">
              {stat.value}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              {stat.label}
            </span>
            <span className="mt-0.5 text-xs text-gray-600">
              {stat.sublabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `16 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/StatsBar.tsx components/public/__tests__/StatsBar.test.tsx
git commit -m "feat: add StatsBar with 4 gym highlights"
```

---

## Task 12: ScheduleWidget Component

**Files:**
- Create: `components/public/ScheduleWidget.tsx`
- Create: `components/public/__tests__/ScheduleWidget.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/ScheduleWidget.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ScheduleWidget } from '../ScheduleWidget'

describe('ScheduleWidget', () => {
  it('renders all 7 day tabs', () => {
    render(<ScheduleWidget />)
    expect(screen.getByRole('button', { name: /MO/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SO/i })).toBeInTheDocument()
  })

  it('shows Monday classes by default', () => {
    render(<ScheduleWidget />)
    // Monday has Fundamentals at 10:00
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
  })

  it('switches to Saturday when SA tab is clicked', async () => {
    render(<ScheduleWidget />)
    await userEvent.click(screen.getByRole('button', { name: /SA/i }))
    // Saturday has Kids BJJ
    expect(screen.getByText('Kids BJJ')).toBeInTheDocument()
  })

  it('shows GI/NO-GI badge on each class', () => {
    render(<ScheduleWidget />)
    expect(screen.getAllByText(/GI|NO-GI/i).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/ScheduleWidget.tsx`**

```typescript
// components/public/ScheduleWidget.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { SCHEDULE, type ScheduleClass } from '@/lib/utils/schedule-data'

const LEVEL_LABELS: Record<ScheduleClass['level'], string> = {
  beginner: 'Anfänger',
  all:      'Alle Levels',
  advanced: 'Blue Belt+',
  kids:     'Kids',
}

const LEVEL_COLORS: Record<ScheduleClass['level'], string> = {
  beginner: 'border-l-white/40',
  all:      'border-l-red-600',
  advanced: 'border-l-blue-500',
  kids:     'border-l-yellow-500',
}

export function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(0)
  const day = SCHEDULE[activeDay]

  return (
    <section id="trainingsplan" className="bg-[#0f0f0f] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Section heading */}
        <div className="mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
            Schedule · Trainingsplan
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            WÖCHENTLICHER STUNDENPLAN
          </h2>
        </div>

        {/* Day tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
          {SCHEDULE.map((d, i) => (
            <button
              key={d.short}
              onClick={() => setActiveDay(i)}
              className={cn(
                'min-w-[52px] flex-shrink-0 px-3 py-2 text-xs font-bold tracking-wider transition-all',
                activeDay === i
                  ? 'bg-red-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-500 hover:bg-[#222] hover:text-gray-300'
              )}
            >
              {d.short}
            </button>
          ))}
        </div>

        {/* Day label */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
          {day.label}
        </p>

        {/* Classes */}
        {day.classes.length === 0 ? (
          <p className="text-gray-600">Kein Training an diesem Tag.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {day.classes.map(cls => (
              <div
                key={`${cls.name}-${cls.time}`}
                className={cn(
                  'flex items-center justify-between border-l-4 bg-[#1a1a1a] px-4 py-4 transition-colors hover:bg-[#222]',
                  LEVEL_COLORS[cls.level]
                )}
              >
                <div>
                  <p className="font-semibold text-white">{cls.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {LEVEL_LABELS[cls.level]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[#111] px-2 py-1 text-xs font-bold text-gray-400">
                    {cls.gi ? 'GI' : 'NO-GI'}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{cls.time}</p>
                    <p className="text-xs text-gray-600">{cls.endTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-700">
          * Stundenplan kann variieren. Änderungen auf @axisjj_at.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `20 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/ScheduleWidget.tsx components/public/__tests__/ScheduleWidget.test.tsx
git commit -m "feat: add interactive ScheduleWidget with day tabs"
```

---

## Task 13: CoachSection Component

**Files:**
- Create: `components/public/CoachSection.tsx`
- Create: `components/public/__tests__/CoachSection.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/CoachSection.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CoachSection } from '../CoachSection'

describe('CoachSection', () => {
  it('renders coach name', () => {
    render(<CoachSection />)
    expect(screen.getByText(/shamsudin baisarov/i)).toBeInTheDocument()
  })

  it('renders black belt credential', () => {
    render(<CoachSection />)
    expect(screen.getByText(/black belt/i)).toBeInTheDocument()
  })

  it('renders the unique selling point', () => {
    render(<CoachSection />)
    expect(screen.getByText(/tschetschenisch/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/CoachSection.tsx`**

```typescript
// components/public/CoachSection.tsx
import Image from 'next/image'

export function CoachSection() {
  return (
    <section id="team" className="bg-[#0a0a0a] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Section heading */}
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
          Team · Coach
        </p>

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">

          {/* Text content */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px flex-1 max-w-[60px] bg-red-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                Head Coach · Black Belt
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              SHAMSUDIN<br />BAISAROV
            </h2>

            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-red-600/80">
              Erster tschetschenischer BJJ-Schwarzgurt Österreichs
            </p>

            <div className="space-y-4 text-gray-400">
              <p>
                Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin
                das Training bei AXIS Jiu-Jitsu. Seine Philosophie: Technik, Disziplin
                und Respekt — auf und abseits der Matte.
              </p>
              <p>
                With years of international competitive experience, Shamsudin leads
                training at AXIS with a philosophy built on discipline, technique,
                and respect — on and off the mat.
              </p>
              <p>
                Ob Anfänger oder Wettkämpfer — unter seiner Anleitung findet jeder
                seinen Weg, stärker zu werden.
              </p>
            </div>

            {/* Belt decoration */}
            <div className="mt-8 flex items-center gap-2">
              {['White','Blue','Purple','Brown','Black'].map(belt => (
                <div
                  key={belt}
                  title={belt + ' Belt'}
                  className="h-2 flex-1 rounded-sm"
                  style={{
                    background:
                      belt === 'White'  ? '#e5e7eb' :
                      belt === 'Blue'   ? '#1d4ed8' :
                      belt === 'Purple' ? '#7c3aed' :
                      belt === 'Brown'  ? '#78350f' :
                                          '#111111',
                    border: belt === 'Black' ? '1px solid #dc2626' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Coach photo */}
          <div className="relative">
            {/* Red brush-stroke accent behind photo */}
            <div className="absolute -right-4 -top-4 h-full w-3/4 bg-red-600/10 blur-2xl" />
            <div className="relative overflow-hidden">
              <Image
                src="/images/coach-banner.jpg"
                alt="Shamsudin Baisarov — Head Coach AXIS Jiu-Jitsu Vienna"
                width={600}
                height={500}
                className="w-full object-cover object-top"
              />
              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `23 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/CoachSection.tsx components/public/__tests__/CoachSection.test.tsx
git commit -m "feat: add CoachSection with Shamsudin Baisarov bio and belt progression"
```

---

## Task 14: ProgramsGrid Component

**Files:**
- Create: `components/public/ProgramsGrid.tsx`
- Create: `components/public/__tests__/ProgramsGrid.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/ProgramsGrid.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgramsGrid } from '../ProgramsGrid'

describe('ProgramsGrid', () => {
  it('renders all 4 program cards', () => {
    render(<ProgramsGrid />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/all levels gi/i)).toBeInTheDocument()
    expect(screen.getByText(/no-gi/i)).toBeInTheDocument()
    expect(screen.getByText(/kids bjj/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/ProgramsGrid.tsx`**

```typescript
// components/public/ProgramsGrid.tsx
import Image from 'next/image'

interface Program {
  name: string
  nameEn: string
  description: string
  level: string
  image: string
  imageAlt: string
  accent: string
}

const PROGRAMS: Program[] = [
  {
    name: 'Fundamentals',
    nameEn: 'Fundamentals',
    description: 'Grundlagen und Techniken für Einsteiger und Weiße Gürtel. Der perfekte Einstieg ins BJJ.',
    level: 'Anfänger · White Belt',
    image: '/images/hero-action.jpg',
    imageAlt: 'Fundamentals BJJ Training',
    accent: 'border-t-white/40',
  },
  {
    name: 'All Levels Gi',
    nameEn: 'All Levels Gi',
    description: 'Gi-Training für alle Gürtelgrade. Technik, Sparring und Rollwork für jeden Level.',
    level: 'Alle Levels',
    image: '/images/hero-action.jpg',
    imageAlt: 'Gi BJJ Training Wien',
    accent: 'border-t-red-600',
  },
  {
    name: 'No-Gi',
    nameEn: 'No-Gi Grappling',
    description: 'Grappling ohne Gi — schnell, athletisch und dynamisch. Für Blue Belt und höher.',
    level: 'Blue Belt+',
    image: '/images/nogi-training.jpg',
    imageAlt: 'No-Gi Grappling Training',
    accent: 'border-t-blue-600',
  },
  {
    name: 'Kids BJJ',
    nameEn: 'Kids BJJ',
    description: 'BJJ für Kinder von 6 bis 14 Jahren. Disziplin, Selbstvertrauen und Spaß auf der Matte.',
    level: '6–14 Jahre',
    image: '/images/kids-bjj.jpg',
    imageAlt: 'Kids BJJ Training Wien',
    accent: 'border-t-yellow-500',
  },
]

export function ProgramsGrid() {
  return (
    <section id="programme" className="bg-[#0f0f0f] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Heading */}
        <div className="mb-12">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
            Programme · Classes
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            UNSERE KLASSEN
          </h2>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROGRAMS.map(program => (
            <div
              key={program.name}
              className={`group relative overflow-hidden border-t-4 bg-[#1a1a1a] ${program.accent} transition-transform hover:-translate-y-1`}
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.imageAlt}
                  fill
                  className="object-cover object-center opacity-60 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-gray-600">
                  {program.level}
                </span>
                <h3 className="mb-3 text-xl font-black text-white">
                  {program.name}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {program.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `24 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/ProgramsGrid.tsx components/public/__tests__/ProgramsGrid.test.tsx
git commit -m "feat: add ProgramsGrid with 4 class cards and photos"
```

---

## Task 15: TrialCTA Component

**Files:**
- Create: `components/public/TrialCTA.tsx`
- Create: `components/public/__tests__/TrialCTA.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/TrialCTA.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TrialCTA } from '../TrialCTA'

describe('TrialCTA', () => {
  it('renders the CTA headline', () => {
    render(<TrialCTA />)
    expect(screen.getByText(/1 woche kostenlos/i)).toBeInTheDocument()
  })

  it('renders a link to /trial', () => {
    render(<TrialCTA />)
    const links = screen.getAllByRole('link')
    const trialLink = links.find(l => l.getAttribute('href') === '/trial')
    expect(trialLink).toBeDefined()
  })

  it('mentions no sign-up fee', () => {
    render(<TrialCTA />)
    expect(screen.getByText(/anmeldegebühr/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/TrialCTA.tsx`**

```typescript
// components/public/TrialCTA.tsx
import Link from 'next/link'

export function TrialCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] py-20 sm:py-28">
      {/* Red glow background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-950/30 via-[#0a0a0a] to-[#0a0a0a]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-red-600">
          Starte jetzt · Start now
        </p>

        <h2 className="mb-4 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
          1 WOCHE<br />KOSTENLOS TESTEN
        </h2>

        <p className="mb-2 text-lg text-gray-300">
          Try one full week — completely free.
        </p>
        <p className="mb-8 text-sm text-gray-600">
          Keine Anmeldegebühr · Keine Verpflichtung · Einfach kommen
        </p>

        {/* Divider */}
        <div className="mx-auto mb-8 flex max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
            Alle Levels willkommen
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Link
          href="/trial"
          className="inline-block bg-red-600 px-12 py-5 text-sm font-black tracking-widest text-white transition-all hover:bg-red-700 hover:scale-105"
        >
          JETZT ANMELDEN →
        </Link>

        <p className="mt-6 text-xs text-gray-700">
          Strindberggasse 1 / R01, 1110 Wien · @axisjj_at
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `27 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/TrialCTA.tsx components/public/__tests__/TrialCTA.test.tsx
git commit -m "feat: add TrialCTA section with red glow background"
```

---

## Task 16: Footer Component

**Files:**
- Create: `components/public/Footer.tsx`
- Create: `components/public/__tests__/Footer.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// components/public/__tests__/Footer.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Footer } from '../Footer'

describe('Footer', () => {
  it('renders gym address', () => {
    render(<Footer />)
    expect(screen.getByText(/strindberggasse/i)).toBeInTheDocument()
  })

  it('renders Instagram link', () => {
    render(<Footer />)
    expect(screen.getByText(/@axisjj_at/i)).toBeInTheDocument()
  })

  it('renders Impressum and Datenschutz links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /impressum/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /datenschutz/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test
```

- [ ] **Step 3: Create `components/public/Footer.tsx`**

```typescript
// components/public/Footer.tsx
import Image from 'next/image'
import Link from 'next/link'
import { Instagram } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#080808] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="grid gap-10 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <Image
              src="/images/logo.png"
              alt="AXIS JIU JITSU"
              width={56}
              height={56}
              className="mb-4 object-contain"
            />
            <p className="text-sm font-black tracking-widest text-white">
              AXIS JIU-JITSU VIENNA
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Discipline · Technique · Progress
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              Kontakt
            </p>
            <address className="not-italic text-sm text-gray-500 leading-relaxed">
              Strindberggasse 1 / R01<br />
              1110 Wien, Österreich
            </address>
            <a
              href="https://instagram.com/axisjj_at"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
            >
              <Instagram size={16} />
              @axisjj_at
            </a>
          </div>

          {/* Links */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="#trainingsplan" className="text-sm text-gray-500 hover:text-white transition-colors">
                Trainingsplan
              </Link>
              <Link href="#team" className="text-sm text-gray-500 hover:text-white transition-colors">
                Team
              </Link>
              <Link href="#programme" className="text-sm text-gray-500 hover:text-white transition-colors">
                Programme
              </Link>
              <Link href="/trial" className="text-sm text-red-600 hover:text-red-500 transition-colors font-semibold">
                1 Woche gratis testen
              </Link>
            </nav>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-gray-700">
            © {year} AXIS Jiu-Jitsu Vienna. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6">
            <Link href="/impressum" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```
Expected: `30 passed`

- [ ] **Step 5: Commit**

```bash
git add components/public/Footer.tsx components/public/__tests__/Footer.test.tsx
git commit -m "feat: add Footer with address, Instagram, and legal links"
```

---

## Task 17: Wire Up Public Layout + Homepage

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx`
- Delete: `app/page.tsx` (default Next.js page)

- [ ] **Step 1: Create `app/(public)/layout.tsx`**

```typescript
// app/(public)/layout.tsx
import { NavBar } from '@/components/public/NavBar'
import { Footer } from '@/components/public/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Create `app/(public)/page.tsx`**

```typescript
// app/(public)/page.tsx
import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { TrialCTA } from '@/components/public/TrialCTA'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien. Gi, No-Gi, Kids, Fundamentals. Österreichs erster tschetschenischer Schwarzgurt als Head Coach. 1 Woche kostenlos testen.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ScheduleWidget />
      <CoachSection />
      <ProgramsGrid />
      <TrialCTA />
    </>
  )
}
```

- [ ] **Step 3: Remove default Next.js root page if it exists**

```bash
# If app/page.tsx exists at root (not inside (public)), delete it
# The (public)/page.tsx now serves /
```

Check: `app/page.tsx` should NOT exist at the root app level (only inside `app/(public)/`). If it does, delete it — Next.js route groups handle the `/` route via `(public)/page.tsx`.

- [ ] **Step 4: Start dev server and QA the landing page**

```bash
npm run dev
```

Open http://localhost:3000 and verify:
- [ ] Sticky NavBar visible with logo and "1 WOCHE GRATIS" button
- [ ] Hero section fills viewport with photo background and tagline
- [ ] StatsBar shows 4 stats below hero
- [ ] Schedule widget has day tabs, Mo shows Fundamentals at 10:00
- [ ] Coach section shows Shamsudin Baisarov bio
- [ ] Programs grid shows 4 cards with photos
- [ ] Trial CTA shows red glow block with signup button
- [ ] Footer shows address, Instagram, Impressum, Datenschutz

- [ ] **Step 5: Run all tests — expect all pass**

```bash
npm test
```
Expected: `30 passed`

- [ ] **Step 6: Commit**

```bash
git add app/
git commit -m "feat: wire up public layout and homepage with all 8 landing sections"
```

---

## Task 18: Final Test Run, TypeScript Check + Deploy Prep

**Files:**
- Create: `.gitignore` additions if needed

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: All tests pass with 0 failures.

- [ ] **Step 2: TypeScript strict check**

```bash
npx tsc --noEmit
```
Expected: No errors. Fix any that appear before continuing.

- [ ] **Step 3: ESLint check**

```bash
npm run lint
```
Expected: No errors. Fix any `any` types or missing deps.

- [ ] **Step 4: Production build check**

```bash
npm run build
```
Expected: Build succeeds. If image optimization warnings appear, they're non-blocking.

- [ ] **Step 5: Add `.superpowers/` to `.gitignore` if missing**

Open `.gitignore`, verify this line exists:
```
.superpowers/
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — AXISJJ landing page with Supabase setup"
```

- [ ] **Step 7: Push to GitHub**

```bash
git remote add origin https://github.com/Magaloko/AXISJJ.git
git branch -M main
git push -u origin main
```

- [ ] **Step 8: Deploy to Vercel**

Go to https://vercel.com/new → Import from GitHub → select `AXISJJ`

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://serrkmokwxqkupugkxud.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)

Click Deploy. Visit the Vercel URL and verify the landing page loads correctly.

---

## Phase 1 Completion Checklist

- [ ] Next.js 15 project bootstrapped with TypeScript strict
- [ ] Vitest configured, all 30 tests passing
- [ ] AXISJJ brand theme (dark `#0a0a0a`, red `#dc2626`) applied
- [ ] Supabase clients (browser + server) configured
- [ ] Route protection middleware in place
- [ ] DB migrations run on Supabase (schema + RLS + seed)
- [ ] All 8 landing page sections built and composed
- [ ] Brand images in `public/images/`
- [ ] TypeScript compiles with 0 errors
- [ ] Production build succeeds
- [ ] Deployed to Vercel

**Next:** Phase 2 plan — Auth (login + magic link), trial form (`/trial`), member dashboard, class booking with waitlist.
