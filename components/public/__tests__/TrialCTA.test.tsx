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
