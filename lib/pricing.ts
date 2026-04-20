import { createClient } from '@/lib/supabase/server'

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

const PLAN_META: Record<PricingCategory, { titleDe: string; subtitleDe?: string; noteDe?: string }> = {
  students: { titleDe: 'Studenten', subtitleDe: 'bis 26 Jahre' },
  adults:   { titleDe: 'Erwachsene' },
  kids:     { titleDe: 'Kinder', noteDe: 'Geschwisterrabatt: 40€/Monat' },
}

/**
 * Fetches current pricing from the database. Falls back to hardcoded PRICING_PLANS
 * if the table is empty or unreachable.
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('pricing_plans')
      .select('category, duration_months, price_per_month, total_price, highlighted')
      .order('category')
      .order('duration_months', { ascending: false })

    if (!data || data.length === 0) return PRICING_PLANS

    const byCategory = new Map<PricingCategory, PricingTier[]>()
    for (const row of data) {
      const tiers = byCategory.get(row.category) ?? []
      tiers.push({
        durationMonths: row.duration_months as 1 | 3 | 6 | 12,
        pricePerMonth: Number(row.price_per_month),
        totalPrice: row.total_price !== null ? Number(row.total_price) : null,
        highlighted: row.highlighted,
      })
      byCategory.set(row.category, tiers)
    }

    const order: PricingCategory[] = ['students', 'adults', 'kids']
    return order
      .filter(cat => byCategory.has(cat))
      .map(cat => ({
        category: cat,
        ...PLAN_META[cat],
        tiers: (byCategory.get(cat) ?? []).sort((a, b) => b.durationMonths - a.durationMonths),
      }))
  } catch {
    return PRICING_PLANS
  }
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
