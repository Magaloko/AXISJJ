// components/members/__tests__/MemberNav.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemberNav } from '../MemberNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MemberNav', () => {
  it('renders user name', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<MemberNav userName="Max Mustermann" />)
    expect(screen.getAllByRole('link', { name: /dashboard/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /buchen/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /gürtel/i })[0]).toBeInTheDocument()
  })

  it('highlights the active link', () => {
    render(<MemberNav userName="Max Mustermann" />)
    const dashboardLink = screen.getAllByRole('link', { name: /dashboard/i })[0]
    expect(dashboardLink.className).toContain('primary')
  })

  it('renders English nav labels when lang is en', () => {
    render(<MemberNav userName="Max Mustermann" lang="en" />)
    expect(screen.getAllByRole('link', { name: /^book$/i })[0]).toBeInTheDocument()
  })
})
