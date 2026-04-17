// components/members/__tests__/NextClassCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NextClassCard } from '../NextClassCard'

const mockSession = {
  id: 'sess-1',
  starts_at: '2026-04-18T10:00:00.000Z',
  ends_at: '2026-04-18T11:30:00.000Z',
  class_types: { name: 'Fundamentals', gi: true, level: 'beginner' as const },
  location: 'Strindberggasse 1, 1110 Wien',
}

describe('NextClassCard', () => {
  it('renders class name', () => {
    render(<NextClassCard session={mockSession} bookingId="book-1" />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
  })

  it('renders GI badge for gi class', () => {
    render(<NextClassCard session={mockSession} bookingId="book-1" />)
    expect(screen.getByText('GI')).toBeInTheDocument()
  })

  it('renders empty state when no session', () => {
    render(<NextClassCard session={null} bookingId={null} />)
    expect(screen.getByText(/keine/i)).toBeInTheDocument()
  })
})
