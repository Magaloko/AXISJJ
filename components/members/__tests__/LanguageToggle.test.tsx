// components/members/__tests__/LanguageToggle.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LanguageToggle } from '../LanguageToggle'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('@/app/actions/profile', () => ({
  updateLanguage: vi.fn().mockResolvedValue({ success: true }),
}))

import { updateLanguage } from '@/app/actions/profile'

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders DE and EN buttons', () => {
    render(<LanguageToggle current="de" />)
    expect(screen.getByRole('button', { name: 'DE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
  })

  it('DE button is aria-pressed when current is de', () => {
    render(<LanguageToggle current="de" />)
    expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('EN button is aria-pressed when current is en', () => {
    render(<LanguageToggle current="en" />)
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls updateLanguage with en when EN clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle current="de" />)
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(updateLanguage).toHaveBeenCalledWith('en')
  })

  it('does not call updateLanguage when active lang clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle current="de" />)
    await user.click(screen.getByRole('button', { name: 'DE' }))
    expect(updateLanguage).not.toHaveBeenCalled()
  })
})
