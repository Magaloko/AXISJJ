import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock the server action
vi.mock('@/app/actions/public-coaches', () => ({
  getPublicCoaches: vi.fn().mockResolvedValue([
    {
      profileId: 'p-1',
      name: 'Shamsudin Baisarov',
      avatarUrl: null,
      specialization: 'Gi & No-Gi · Head Coach',
      bio: 'Mit jahrelanger Erfahrung auf internationalem Niveau.',
      achievements: 'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver',
      beltName: 'Black Belt',
      beltColorHex: '#111111',
      displayOrder: 1,
    },
  ]),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CoachSection } from '../CoachSection'

describe('CoachSection', () => {
  it('renders coach name', async () => {
    const jsx = await CoachSection({ lang: 'de' })
    render(jsx as React.ReactElement)
    expect(screen.getAllByText(/shamsudin baisarov/i).length).toBeGreaterThan(0)
  })

  it('renders specialization', async () => {
    const jsx = await CoachSection({ lang: 'de' })
    render(jsx as React.ReactElement)
    expect(screen.getAllByText(/head coach/i).length).toBeGreaterThan(0)
  })

  it('renders achievements', async () => {
    const jsx = await CoachSection({ lang: 'de' })
    render(jsx as React.ReactElement)
    expect(screen.getAllByText(/ibjjf european silver/i).length).toBeGreaterThan(0)
  })

  it('renders nothing when no coaches', async () => {
    const { getPublicCoaches } = await import('@/app/actions/public-coaches')
    vi.mocked(getPublicCoaches).mockResolvedValueOnce([])
    const jsx = await CoachSection({ lang: 'de' })
    expect(jsx).toBeNull()
  })
})
