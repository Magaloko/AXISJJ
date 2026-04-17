import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ScheduleWidget } from '../ScheduleWidget'

describe('ScheduleWidget', () => {
  it('renders all 7 day tab buttons', () => {
    render(<ScheduleWidget />)
    expect(screen.getByRole('button', { name: 'MO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SO' })).toBeInTheDocument()
  })
  it('shows Monday classes by default', () => {
    render(<ScheduleWidget />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
  })
  it('switches to Saturday on SA click', async () => {
    render(<ScheduleWidget />)
    await userEvent.click(screen.getByRole('button', { name: 'SA' }))
    expect(screen.getByText('Kids BJJ')).toBeInTheDocument()
  })
  it('shows GI or NO-GI badge for each class', () => {
    render(<ScheduleWidget />)
    expect(screen.getAllByText(/^(GI|NO-GI)$/).length).toBeGreaterThan(0)
  })
})
