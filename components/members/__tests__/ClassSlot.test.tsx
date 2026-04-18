// components/members/__tests__/ClassSlot.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ClassSlot } from '../ClassSlot'

vi.mock('@/app/actions/bookings', () => ({
  bookClass: vi.fn(),
  cancelBooking: vi.fn(),
}))

const mockSession = {
  id: 'sess-1',
  starts_at: '2026-04-18T10:00:00.000Z',
  ends_at: '2026-04-18T11:30:00.000Z',
  capacity: 20,
  location: 'Strindberggasse 1, 1110 Wien',
  class_types: { name: 'Fundamentals', gi: true, level: 'beginner' },
}

describe('ClassSlot', () => {
  it('renders class name and time', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/5\/20/)).toBeInTheDocument()
  })

  it('shows Buchen button when not booked', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} />)
    expect(screen.getByRole('button', { name: /buchen/i })).toBeInTheDocument()
  })

  it('shows Stornieren button when confirmed', () => {
    render(<ClassSlot session={mockSession} userBooking={{ id: 'b-1', status: 'confirmed' }} confirmedCount={6} />)
    expect(screen.getByRole('button', { name: /stornieren/i })).toBeInTheDocument()
  })

  it('shows Warteliste badge when waitlisted', () => {
    render(<ClassSlot session={mockSession} userBooking={{ id: 'b-1', status: 'waitlisted' }} confirmedCount={20} />)
    expect(screen.getByText(/warteliste/i)).toBeInTheDocument()
  })

  it('shows Ausgebucht when full and no booking', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={20} />)
    expect(screen.getByText(/ausgebucht/i)).toBeInTheDocument()
  })

  it('renders English Book button when lang is en', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={5} lang="en" />)
    expect(screen.getByRole('button', { name: /book/i })).toBeInTheDocument()
  })

  it('renders English Full text when full and lang is en', () => {
    render(<ClassSlot session={mockSession} userBooking={null} confirmedCount={20} lang="en" />)
    expect(screen.getByText(/^Full$/i)).toBeInTheDocument()
  })
})
