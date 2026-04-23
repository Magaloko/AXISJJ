import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ScheduleWidget, type PublicDaySchedule } from '../ScheduleWidget'

const mockSchedule: PublicDaySchedule[] = [
  { dayLabel: 'Montag',    dayShort: 'MO', dateLabel: '27.04', isoDate: '2026-04-27', sessions: [
    { id: '1', name: 'Fundamentals',  time: '10:00', endTime: '11:00', level: 'beginner', gi: true,  trainer: 'Coach' },
    { id: '2', name: 'All Levels Gi', time: '18:00', endTime: '19:30', level: 'all',      gi: true,  trainer: 'Coach' },
    { id: '3', name: 'No-Gi',         time: '19:30', endTime: '21:00', level: 'all',      gi: false, trainer: 'Coach' },
  ]},
  { dayLabel: 'Dienstag',  dayShort: 'DI', dateLabel: '28.04', isoDate: '2026-04-28', sessions: [] },
  { dayLabel: 'Mittwoch',  dayShort: 'MI', dateLabel: '29.04', isoDate: '2026-04-29', sessions: [] },
  { dayLabel: 'Donnerstag',dayShort: 'DO', dateLabel: '30.04', isoDate: '2026-04-30', sessions: [] },
  { dayLabel: 'Freitag',   dayShort: 'FR', dateLabel: '01.05', isoDate: '2026-05-01', sessions: [] },
  { dayLabel: 'Samstag',   dayShort: 'SA', dateLabel: '02.05', isoDate: '2026-05-02', sessions: [
    { id: '4', name: 'Kids BJJ', time: '10:00', endTime: '11:00', level: 'kids', gi: true, trainer: 'Coach' },
  ]},
  { dayLabel: 'Sonntag',   dayShort: 'SO', dateLabel: '03.05', isoDate: '2026-05-03', sessions: [] },
]

describe('ScheduleWidget', () => {
  it('renders all 7 day tab buttons', () => {
    render(<ScheduleWidget schedule={mockSchedule} lang="de" />)
    expect(screen.getByRole('button', { name: 'MO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SO' })).toBeInTheDocument()
  })

  it('shows Monday classes by default', () => {
    render(<ScheduleWidget schedule={mockSchedule} lang="de" />)
    expect(screen.getAllByText('Fundamentals').length).toBeGreaterThan(0)
  })

  it('switches to Saturday on SA click', async () => {
    render(<ScheduleWidget schedule={mockSchedule} lang="de" />)
    await userEvent.click(screen.getByRole('button', { name: 'SA' }))
    expect(screen.getAllByText('Kids BJJ').length).toBeGreaterThan(0)
  })

  it('shows GI or NO-GI badge for each class', () => {
    render(<ScheduleWidget schedule={mockSchedule} lang="de" />)
    expect(screen.getAllByText(/^(GI|NO-GI)$/).length).toBeGreaterThan(0)
  })
})
