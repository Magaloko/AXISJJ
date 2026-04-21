import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsBar } from '../StatsBar'

describe('StatsBar', () => {
  it('renders 4 stat items', () => {
    render(<StatsBar lang="de" />)
    expect(screen.getByText(/klassen/i)).toBeInTheDocument()
    expect(screen.getAllByText(/gi/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/black belt/i)).toBeInTheDocument()
    expect(screen.getByText(/kids/i)).toBeInTheDocument()
  })
})
