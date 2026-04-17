// components/members/__tests__/SkillCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SkillCard } from '../SkillCard'

vi.mock('@/app/actions/skills', () => ({
  updateSkillStatus: vi.fn().mockResolvedValue({ success: true }),
}))

const mockSkill = {
  id: 'skill-1',
  name: 'Armbar from Guard',
  description: 'Classic submission from closed guard',
  video_url: null,
}

describe('SkillCard', () => {
  it('renders skill name', () => {
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    expect(screen.getByText('Armbar from Guard')).toBeInTheDocument()
  })

  it('shows Nicht begonnen status for not_started', () => {
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    expect(screen.getByRole('button', { name: /nicht begonnen/i })).toBeInTheDocument()
  })

  it('shows Beherrscht for mastered', () => {
    render(<SkillCard skill={mockSkill} initialStatus="mastered" />)
    expect(screen.getByRole('button', { name: /beherrscht/i })).toBeInTheDocument()
  })

  it('cycles status on click', async () => {
    const user = userEvent.setup()
    render(<SkillCard skill={mockSkill} initialStatus="not_started" />)
    await user.click(screen.getByRole('button', { name: /nicht begonnen/i }))
    expect(screen.getByRole('button', { name: /in arbeit/i })).toBeInTheDocument()
  })

  it('renders video link when video_url provided', () => {
    render(<SkillCard skill={{ ...mockSkill, video_url: 'https://example.com' }} initialStatus="not_started" />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})
