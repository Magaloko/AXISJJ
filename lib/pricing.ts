export type PricingCategory = 'students' | 'adults' | 'kids'

export interface PricingTier {
  durationMonths: 12 | 6 | 3 | 1
  pricePerMonth: number
  totalPrice: number | null
  highlighted?: boolean
}

export interface PricingPlan {
  category: PricingCategory
  titleDe: string
  subtitleDe?: string
  noteDe?: string
  tiers: PricingTier[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    category: 'students',
    titleDe: 'Studenten',
    subtitleDe: 'bis 26 Jahre',
    tiers: [
      { durationMonths: 12, pricePerMonth: 70, totalPrice: 840, highlighted: true },
      { durationMonths: 6, pricePerMonth: 80, totalPrice: 480 },
      { durationMonths: 3, pricePerMonth: 90, totalPrice: 270 },
      { durationMonths: 1, pricePerMonth: 100, totalPrice: null },
    ],
  },
  {
    category: 'adults',
    titleDe: 'Erwachsene',
    tiers: [
      { durationMonths: 12, pricePerMonth: 80, totalPrice: 960, highlighted: true },
      { durationMonths: 6, pricePerMonth: 90, totalPrice: 540 },
      { durationMonths: 3, pricePerMonth: 100, totalPrice: 300 },
      { durationMonths: 1, pricePerMonth: 100, totalPrice: null },
    ],
  },
  {
    category: 'kids',
    titleDe: 'Kinder',
    noteDe: 'Geschwisterrabatt: 40€/Monat',
    tiers: [
      { durationMonths: 12, pricePerMonth: 50, totalPrice: 600, highlighted: true },
      { durationMonths: 6, pricePerMonth: 55, totalPrice: 330 },
      { durationMonths: 3, pricePerMonth: 60, totalPrice: 180 },
      { durationMonths: 1, pricePerMonth: 65, totalPrice: null },
    ],
  },
]
