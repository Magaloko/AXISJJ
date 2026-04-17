import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgramsGrid } from '../ProgramsGrid'

describe('ProgramsGrid', () => {
  it('renders all 4 program cards', () => {
    render(<ProgramsGrid />)
    expect(screen.getByText('Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/all levels gi/i)).toBeInTheDocument()
    expect(screen.getByText(/no-gi/i)).toBeInTheDocument()
    expect(screen.getByText(/kids bjj/i)).toBeInTheDocument()
  })
})
