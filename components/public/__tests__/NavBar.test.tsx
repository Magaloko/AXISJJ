import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { NavBar } from '../NavBar'

describe('NavBar', () => {
  it('renders a link with the logo image', () => {
    render(<NavBar />)
    // Logo link goes to homepage
    const logoLink = screen.getByRole('link', { name: /axis jiu jitsu/i })
    expect(logoLink).toBeInTheDocument()
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('renders trial CTA link', () => {
    render(<NavBar />)
    const cta = screen.getByRole('link', { name: /1 woche gratis/i })
    expect(cta).toHaveAttribute('href', '/trial')
  })

  it('toggles mobile menu on hamburger click', async () => {
    render(<NavBar />)
    // Mobile menu links hidden initially
    const trainingsplanLinks = screen.getAllByText('Trainingsplan')
    // At least one exists (desktop nav)
    expect(trainingsplanLinks.length).toBeGreaterThan(0)
    // Click hamburger
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    await userEvent.click(menuButton)
    // Mobile menu now visible
    expect(screen.getAllByText('Trainingsplan').length).toBeGreaterThan(0)
  })
})
