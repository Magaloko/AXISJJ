import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingCard } from '../PricingCard'
import type { PricingPlan } from '@/lib/pricing'

const basePlan: PricingPlan = {
  category: 'students',
  titleDe: 'Studenten',
  subtitleDe: 'bis 26 Jahre',
  tiers: [
    { durationMonths: 12, pricePerMonth: 70, totalPrice: 840, highlighted: true },
    { durationMonths: 6, pricePerMonth: 80, totalPrice: 480 },
    { durationMonths: 1, pricePerMonth: 100, totalPrice: null },
  ],
}

describe('PricingCard', () => {
  it('renders title and subtitle', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    expect(screen.getByText('Studenten')).toBeInTheDocument()
    expect(screen.getByText('bis 26 Jahre')).toBeInTheDocument()
  })

  it('renders each tier with duration', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    expect(screen.getByText('12 Monate')).toBeInTheDocument()
    expect(screen.getByText('6 Monate')).toBeInTheDocument()
    expect(screen.getByText('1 Monat')).toBeInTheDocument()
  })

  it('shows total prices for multi-month tiers', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    expect(screen.getByText('840€')).toBeInTheDocument()
    expect(screen.getByText('480€')).toBeInTheDocument()
  })

  it('omits total for the 1-month tier', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    // The 1-month row renders monthly price 100€ with no "gesamt" annotation.
    // There are exactly 2 "gesamt" labels for the other two tiers.
    const gesamtLabels = screen.getAllByText(/gesamt/i)
    expect(gesamtLabels).toHaveLength(2)
  })

  it('shows "Beste Wahl" badge only on highlighted tier', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    const badges = screen.getAllByText('Beste Wahl')
    expect(badges).toHaveLength(1)
  })

  it('renders the note when provided', () => {
    const withNote: PricingPlan = {
      ...basePlan,
      noteDe: 'Geschwisterrabatt: 40€/Monat',
    }
    render(<PricingCard plan={withNote} lang="de" />)
    expect(screen.getByText(/Geschwisterrabatt/)).toBeInTheDocument()
  })

  it('does not render the note when absent', () => {
    render(<PricingCard plan={basePlan} lang="de" />)
    expect(screen.queryByText(/Geschwisterrabatt/)).toBeNull()
  })
})
