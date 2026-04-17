// app/(public)/trial/__tests__/TrialForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TrialPage from '../page'

// Mock the server action
vi.mock('@/app/actions/leads', () => ({
  createLead: vi.fn(),
}))

import { createLead } from '@/app/actions/leads'

describe('Trial signup page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders the signup form', () => {
    render(<TrialPage />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument()
  })

  it('shows success state after submission', async () => {
    vi.mocked(createLead).mockResolvedValueOnce({ success: true })
    render(<TrialPage />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Max Mustermann' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'max@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/danke/i)).toBeInTheDocument()
    })
  })

  it('shows error when server action fails', async () => {
    vi.mocked(createLead).mockResolvedValueOnce({ error: 'Fehler beim Speichern' })
    render(<TrialPage />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Max Mustermann' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'max@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/fehler/i)).toBeInTheDocument()
    })
  })
})
