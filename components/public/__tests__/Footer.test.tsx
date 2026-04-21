import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { GymSettings } from '@/lib/gym-settings'

const mockSettings: GymSettings = {
  name: 'AXIS Jiu-Jitsu',
  address_line1: 'Strindberggasse 1 / R01',
  address_line2: null,
  postal_code: '1110',
  city: 'Wien',
  country: 'Österreich',
  phone: null,
  email: null,
  website: null,
  opening_hours: {
    mon: { open: '16:00', close: '22:00', closed: false },
    tue: { open: '16:00', close: '22:00', closed: false },
    wed: { open: '16:00', close: '22:00', closed: false },
    thu: { open: '16:00', close: '22:00', closed: false },
    fri: { open: '16:00', close: '22:00', closed: false },
    sat: { open: '10:00', close: '14:00', closed: false },
    sun: { open: null, close: null, closed: true },
  },
  house_rules: null,
  cancellation_policy: null,
  pricing_info: null,
  updated_at: new Date().toISOString(),
}

vi.mock('@/lib/gym-settings', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gym-settings')>('@/lib/gym-settings')
  return {
    ...actual,
    getGymSettings: () => Promise.resolve(mockSettings),
  }
})

import { Footer } from '../Footer'

describe('Footer', () => {
  it('renders gym address from settings', async () => {
    const ui = await Footer({ lang: 'de' })
    render(ui)
    expect(screen.getByText(/strindberggasse/i)).toBeInTheDocument()
  })

  it('renders Kontakt link pointing to /kontakt', async () => {
    const ui = await Footer({ lang: 'de' })
    render(ui)
    const kontaktLink = screen.getByRole('link', { name: /^kontakt$/i })
    expect(kontaktLink).toHaveAttribute('href', '/kontakt')
  })

  it('renders Impressum and Datenschutz links', async () => {
    const ui = await Footer({ lang: 'de' })
    render(ui)
    expect(screen.getByRole('link', { name: /impressum/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /datenschutz/i })).toBeInTheDocument()
  })
})
