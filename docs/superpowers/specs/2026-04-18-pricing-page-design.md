# AXISJJ Pricing Page — Design Spec

**Date:** 2026-04-18
**Scope:** New public `/preise` page listing membership prices across three categories (Studenten, Erwachsene, Kinder) and four durations (12/6/3/1 Monate).

---

## 1. Data Model

Static TypeScript data — no DB. Prices rarely change and when they do, an owner can edit `lib/pricing.ts` and redeploy.

```typescript
// lib/pricing.ts
export type PricingCategory = 'students' | 'adults' | 'kids'

export interface PricingTier {
  durationMonths: 12 | 6 | 3 | 1
  pricePerMonth: number     // in Euro
  totalPrice: number | null // null when 1-Monat (no total shown)
  highlighted?: boolean     // true for best deal (12 Monate)
}

export interface PricingPlan {
  category: PricingCategory
  titleDe: string
  subtitleDe?: string       // e.g. "(bis 26 Jahre)"
  noteDe?: string           // e.g. "Geschwisterrabatt: 40€/Monat"
  icon: string              // emoji for visual anchor
  tiers: PricingTier[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    category: 'students',
    titleDe: 'Studenten',
    subtitleDe: 'bis 26 Jahre',
    icon: '🎓',
    tiers: [
      { durationMonths: 12, pricePerMonth: 70,  totalPrice: 840, highlighted: true },
      { durationMonths: 6,  pricePerMonth: 80,  totalPrice: 480 },
      { durationMonths: 3,  pricePerMonth: 90,  totalPrice: 270 },
      { durationMonths: 1,  pricePerMonth: 100, totalPrice: null },
    ],
  },
  {
    category: 'adults',
    titleDe: 'Erwachsene',
    icon: '🥋',
    tiers: [
      { durationMonths: 12, pricePerMonth: 80,  totalPrice: 960, highlighted: true },
      { durationMonths: 6,  pricePerMonth: 90,  totalPrice: 540 },
      { durationMonths: 3,  pricePerMonth: 100, totalPrice: 300 },
      { durationMonths: 1,  pricePerMonth: 100, totalPrice: null },
    ],
  },
  {
    category: 'kids',
    titleDe: 'Kinder',
    noteDe: 'Geschwisterrabatt: 40€/Monat',
    icon: '👶',
    tiers: [
      { durationMonths: 12, pricePerMonth: 50, totalPrice: 600, highlighted: true },
      { durationMonths: 6,  pricePerMonth: 55, totalPrice: 330 },
      { durationMonths: 3,  pricePerMonth: 60, totalPrice: 180 },
      { durationMonths: 1,  pricePerMonth: 65, totalPrice: null },
    ],
  },
]
```

## 2. Components

**`components/public/PricingCard.tsx`** — renders one `PricingPlan`:
- Icon + title + optional subtitle at top
- Stack of 4 tier rows
- Highlighted tier (12 Monate) gets `bg-primary/5` background and "BESTE WAHL" badge
- Each tier shows: `{months} Monate`, `{price}€/Monat`, total (if not null: `ges. {total}€`)
- Footer note (Geschwisterrabatt) if `noteDe` set

## 3. Page

**`app/(public)/preise/page.tsx`** — server component:
- h1: "Preise"
- Subtitle: "Alle Preise inkl. USt. Keine Anmeldegebühr."
- 3-column grid (`md:grid-cols-3`) of `PricingCard`
- CTA at bottom: "Probetraining buchen" button → `/trial`
- Uses existing public layout (NavBar + Footer)

## 4. Nav Integration

- `components/public/NavBar.tsx` — add `{ href: '/preise', label: 'Preise' }` to `NAV_LINKS` before "Kontakt"
- `components/public/Footer.tsx` — add `/preise` link to "Links" column before "Kontakt"

## 5. Testing

`components/public/__tests__/PricingCard.test.tsx`:
- Renders title, subtitle, icon
- Renders all tiers with correct prices
- Shows "BESTE WAHL" badge on highlighted tier
- Renders noteDe when present

## 6. Out of Scope

- Editing prices via admin UI (owner edits `lib/pricing.ts` in git)
- Language toggle (DE only — matches existing public pages)
- Discount/coupon codes
- Direct payment integration
