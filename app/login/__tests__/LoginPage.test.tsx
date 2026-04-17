// app/login/__tests__/LoginPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '../page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

describe('LoginPage', () => {
  it('renders email input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('shows magic link mode by default', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /magic link/i })).toBeInTheDocument()
  })

  it('toggles to password mode', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText(/passwort/i))
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument()
  })
})
