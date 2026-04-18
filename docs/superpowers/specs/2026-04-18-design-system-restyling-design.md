# AXISJJ Design System Restyling — Plan 1

## Goal

Replace the dark theme with the light paper design system from the `index.html` template and apply it uniformly across all existing pages: public landing, trial, login, and the full member portal.

## Architecture

A single `globals.css` change swaps the color tokens and font stack. All existing components consume these tokens via Tailwind utilities — no component-level color hardcoding. Components are restyled one by one to use the new token names and updated class compositions. No routing or data-layer changes.

## Tech Stack

- Tailwind CSS v4 (`@theme inline` in `globals.css`)
- Google Fonts: Inter Tight, JetBrains Mono, Instrument Serif (loaded via `next/font/google` in `app/layout.tsx`)
- oklch color space for all design tokens
- Existing Next.js App Router structure unchanged

---

## Design Tokens

### Token strategy

**Update existing token VALUES, not names.** The current `globals.css` uses `--color-background`, `--color-foreground`, `--color-surface`, etc. — these map to Tailwind utilities `bg-background`, `text-foreground`, `bg-surface`, etc. that are already used throughout the codebase. Keeping the names means components inherit the new palette without class-name changes. Only components that need structural/layout changes (new elements, different class compositions) are touched.

### Colors (`app/globals.css` — updated values in `@theme inline`)

| Token | Old value | New value | Role |
|---|---|---|---|
| `--color-background` | `#0a0a0a` | `oklch(98% 0.004 80)` | Page background (warm white) |
| `--color-foreground` | `#ffffff` | `oklch(16% 0.010 60)` | Primary text |
| `--color-surface` | `#111111` | `oklch(94% 0.005 80)` | Card / section backgrounds |
| `--color-surface-muted` | `#1a1a1a` | `oklch(91% 0.006 80)` | Hover surface |
| `--color-surface-hover` | `#222222` | `oklch(89% 0.007 80)` | Active hover |
| `--color-border` | `#1a1a1a` | `oklch(88% 0.006 80)` | Dividers, input borders |
| `--color-input` | `#1a1a1a` | `oklch(96% 0.004 80)` | Input fill |
| `--color-ring` | `#dc2626` | `oklch(58% 0.21 28)` | Focus ring |
| `--color-primary` | `#dc2626` | `oklch(58% 0.21 28)` | Accent / CTA |
| `--color-primary-foreground` | `#ffffff` | `oklch(99% 0.000 0)` | Text on accent |
| `--color-muted` | `#1a1a1a` | `oklch(94% 0.005 80)` | Muted background |
| `--color-muted-foreground` | `#9ca3af` | `oklch(50% 0.008 60)` | Secondary text |
| `--color-card` | `#111111` | `oklch(94% 0.005 80)` | Card background |
| `--color-card-foreground` | `#ffffff` | `oklch(16% 0.010 60)` | Card text |
| `--color-accent` | `#dc2626` | `oklch(58% 0.21 28)` | Accent (same as primary) |
| `--color-accent-foreground` | `#ffffff` | `oklch(99% 0.000 0)` | Text on accent |
| `--color-brand-red` | `#dc2626` | `oklch(58% 0.21 28)` | Brand red |
| `--color-brand-red-dark` | `#991b1b` | `oklch(44% 0.18 28)` | Brand red dark |
| `--color-brand-red-light` | `#ef4444` | `oklch(64% 0.22 28)` | Brand red light |
| `--color-destructive` | `#ef4444` | `oklch(58% 0.21 28)` | Destructive action |

Add two new tokens for the hover accent (used in components):

```css
--color-primary-hover: oklch(52% 0.21 28);  /* accent hover */
--color-bg: oklch(98% 0.004 80);             /* alias for background (existing) */
```

### Fonts

```css
--font-sans: 'Inter Tight', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--font-serif: 'Instrument Serif', Georgia, serif;
```

Loaded via `next/font/google` in `app/layout.tsx`:
- `Inter_Tight` — weights 400, 500, 600, 700
- `JetBrains_Mono` — weights 400, 500
- `Instrument_Serif` — weight 400, style italic

---

## UI Primitives (`components/ui/`)

### Button (`button.tsx`)
- `default` variant: `bg-accent text-accent-fg hover:bg-accent-hover` (replaces dark red)
- `outline` variant: `border-border text-ink bg-transparent hover:bg-surface`
- `ghost` variant: `text-ink-muted hover:bg-surface hover:text-ink`
- `secondary` variant: `bg-surface text-ink hover:bg-surface-hover`
- All other variants: updated to light palette

### Input (`input.tsx`)
- `bg-input border-border text-ink placeholder:text-ink-muted`
- Focus ring: `ring-ring`

### Label (`label.tsx`)
- `text-ink` (was `text-foreground`)

### Badge (`badge.tsx`)
- `default`: `bg-accent text-accent-fg`
- `secondary`: `bg-surface text-ink`
- `outline`: `border-border text-ink`

---

## Public Components (`components/public/`)

### NavBar
- Background: `oklch(98% 0.004 80 / 0.85)` + `backdrop-blur-md` (glassmorphism on light)
- Logo + links: `text-ink`
- Active link: `text-accent`
- Mobile menu: `bg-paper border-b border-border`
- CTA button: accent variant

### Hero
- Background: `bg-paper`
- Main headline: Inter Tight, `text-ink`, large (`text-5xl md:text-7xl`)
- Animated word-cycle: replaces current word with next every 2.5s using CSS `@keyframes` fade — words defined in component props
- Tagline: Instrument Serif italic, `text-ink-muted`
- CTA: accent Button → `/trial`
- Secondary link: ghost Button → `#schedule`

### StatsBar
- Background: `bg-surface`
- Numbers: JetBrains Mono, `text-accent`, large
- Labels: Inter Tight, `text-ink-muted`, small
- Stats: `1200+ Trainings`, `98% Wiederkehrquote`, `12 Jahre Erfahrung`, `3 Weltmeister`

### ScheduleWidget
- Background: `bg-paper`
- Day chips: `bg-surface text-ink` default, `bg-accent text-accent-fg` active
- Class rows: `border-b border-border`, time in `font-mono text-ink-muted`, name in `text-ink`, type badge
- Data stays static (from template JS object: MO–SO schedule)
- Active day chip controlled by React state (replaces vanilla JS)

### CoachSection
- Background: `bg-surface`
- Card: `bg-paper border border-border`
- Coach name: Inter Tight bold, `text-ink`
- Bio: Inter Tight, `text-ink-muted`
- Stats/credentials: JetBrains Mono, `text-accent`

### ProgramsGrid
- Background: `bg-paper`
- 4 cards (`bg-surface border border-border`): Fundamentals, No-Gi, Kids BJJ, Competition
- Category tag: `text-accent font-mono text-sm`
- Card title: Inter Tight bold
- Hover: `hover:bg-surface-hover hover:border-accent/30`

### TrialCTA
- Background: `bg-accent`
- Text: `text-accent-fg`
- Button: `outline` variant in `border-accent-fg text-accent-fg hover:bg-accent-fg/10`

### Footer
- Background: `bg-surface border-t border-border`
- 3-column grid: logo+tagline / nav links / address+hours
- Text: `text-ink-muted`, links `hover:text-ink`

---

## Public Pages

### Landing page (`app/(public)/page.tsx`)
No structural change — it already composes the 8 public components. After component restyling, it inherits the new look automatically. Verify section order matches template: NavBar → Hero → StatsBar → Schedule → Coach → Programs → TrialCTA → Footer.

### Trial page (`app/(public)/trial/page.tsx`)
- Background: `bg-paper`
- Centered card: `bg-surface border border-border`
- Form fields: new Input primitive
- Submit button: accent Button

---

## Login Page (`app/login/page.tsx`)

- Background: `bg-paper`
- Card: `bg-surface border border-border` centered with `max-w-md`
- Tabs (Magic Link / Password): `bg-surface` inactive, `bg-accent text-accent-fg` active
- Inputs + Button: new primitives
- Logo / brand mark above card: `text-accent`

---

## Member Portal Components (`components/members/`)

### MemberNav
- Background: `bg-surface border-r border-border` (sidebar)
- Logo area: `text-ink`
- Nav items: `text-ink-muted hover:bg-surface-hover hover:text-ink`
- Active item: `bg-paper text-ink border-l-2 border-accent`
- Mobile bottom bar: `bg-surface border-t border-border`

### NextClassCard
- `bg-surface border border-border`
- Time: JetBrains Mono, `text-accent`
- Title: Inter Tight bold, `text-ink`
- Details: `text-ink-muted`

### ClassSlot
- Row: `border-b border-border bg-paper hover:bg-surface`
- Time: `font-mono text-ink-muted`
- Book button: accent Button (small)
- Cancel button: ghost Button (small)
- Full class: `text-ink-muted` + disabled state

### BeltProgress
- Card: `bg-surface border border-border`
- Belt color strip: real belt colors (white/blue/purple/brown/black)
- Stripe indicators: `bg-accent` filled, `bg-border` empty
- Stats: JetBrains Mono `text-ink`
- Labels: Inter Tight `text-ink-muted`

### SkillCard
- Card: `bg-surface border border-border`
- Skill name: Inter Tight `text-ink`
- Status badge: `bg-accent/10 text-accent` for mastered, `bg-surface text-ink-muted` for learning
- Progress bar: `bg-accent` fill on `bg-border` track

### ProfileForm
- Labels: Inter Tight `text-ink`
- Inputs: new Input primitive
- Submit: accent Button
- Saved state: `text-accent` checkmark

### LanguageToggle
- Two buttons: `bg-surface text-ink-muted` default, `bg-accent text-accent-fg` active (`aria-pressed`)
- Border: `border border-border`

---

## Member Pages

### Dashboard (`app/(members)/dashboard/page.tsx`)
- Background: `bg-paper`
- Page title: Inter Tight bold `text-ink`
- Stat tiles: `bg-surface border border-border`, number in `font-mono text-accent`
- NextClassCard + booking list inherit component restyling

### Buchen (`app/(members)/buchen/page.tsx`)
- Background: `bg-paper`
- Page title: Inter Tight bold `text-ink`
- ClassSlot list inherits component restyling

### Gürtel (`app/(members)/gürtel/page.tsx`)
- Background: `bg-paper`
- BeltProgress component inherits restyling
- History section: rows with `border-b border-border`, mono dates

### Skills (`app/(members)/skills/page.tsx`)
- Background: `bg-paper`
- Grid of SkillCards inherits restyling
- Empty state: `text-ink-muted`

### Konto (`app/(members)/konto/page.tsx`)
- Background: `bg-paper`
- Sections: `bg-surface border border-border` cards
- ProfileForm + LanguageToggle + Documents inherit restyling
- Download links: `text-accent hover:text-accent-hover`

---

## Scope Boundaries

**In scope:**
- `app/globals.css` — token replacement
- `app/layout.tsx` — font loading
- `components/ui/` — 4 primitives (button, input, label, badge)
- `components/public/` — 8 components
- `components/members/` — 7 components
- `app/(public)/page.tsx`, `app/(public)/trial/page.tsx`
- `app/login/page.tsx`
- `app/(members)/` — 5 pages + layout

**Out of scope (Plan 2):**
- Admin pages (new build)
- Any data/API changes
- New features or routing changes
- `app/(members)/layout.tsx` data logic (layout stays, only visual update)

---

## Testing

- Existing Vitest + React Testing Library tests must continue to pass after restyling
- No new tests required for pure CSS/class changes
- Component tests that assert on class names must be updated if class names change
- Run `pnpm test` (or `npm test`) after each task batch to verify green
