// components/members/__tests__/ProfileForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProfileForm } from '../ProfileForm'

vi.mock('@/app/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
}))

import { updateProfile } from '@/app/actions/profile'

const mockProfile = {
  full_name: 'Max Mustermann',
  phone: '+43 660 1234567',
  date_of_birth: '1990-05-15',
  language: 'de',
}

describe('ProfileForm', () => {
  it('renders pre-filled full name', () => {
    render(<ProfileForm profile={mockProfile} lang="de" />)
    expect(screen.getByDisplayValue('Max Mustermann')).toBeInTheDocument()
  })

  it('renders German labels when lang is de', () => {
    render(<ProfileForm profile={mockProfile} lang="de" />)
    expect(screen.getByText('Vollständiger Name')).toBeInTheDocument()
  })

  it('renders English labels when lang is en', () => {
    render(<ProfileForm profile={mockProfile} lang="en" />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
  })

  it('shows saved message on successful submit', async () => {
    const user = userEvent.setup()
    render(<ProfileForm profile={mockProfile} lang="de" />)
    await user.click(screen.getByRole('button', { name: /speichern/i }))
    await waitFor(() => expect(screen.getByText(/gespeichert/i)).toBeInTheDocument())
  })

  it('shows error message on failed submit', async () => {
    vi.mocked(updateProfile).mockResolvedValueOnce({ error: 'Speichern fehlgeschlagen.' })
    const user = userEvent.setup()
    render(<ProfileForm profile={mockProfile} lang="de" />)
    await user.click(screen.getByRole('button', { name: /speichern/i }))
    await waitFor(() => expect(screen.getByText('Speichern fehlgeschlagen.')).toBeInTheDocument())
  })
})
