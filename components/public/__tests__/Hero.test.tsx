import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Hero } from '../Hero'

describe('Hero', () => {
  it('renders the three tagline words', () => {
    render(<Hero />)
    expect(screen.getByText('DISCIPLINE.')).toBeInTheDocument()
    expect(screen.getByText('TECHNIQUE.')).toBeInTheDocument()
    expect(screen.getByText('PROGRESS.')).toBeInTheDocument()
  })
  it('trial CTA links to /trial', () => {
    render(<Hero />)
    const cta = screen.getByRole('link', { name: /1 woche gratis/i })
    expect(cta).toHaveAttribute('href', '/trial')
  })
  it('renders address', () => {
    render(<Hero />)
    expect(screen.getByText(/strindberggasse/i)).toBeInTheDocument()
  })
})
