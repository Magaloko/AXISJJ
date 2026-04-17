import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CoachSection } from '../CoachSection'

describe('CoachSection', () => {
  it('renders coach name', () => {
    render(<CoachSection />)
    expect(screen.getByText(/shamsudin baisarov/i)).toBeInTheDocument()
  })

  it('renders black belt credential', () => {
    render(<CoachSection />)
    expect(screen.getByText(/black belt/i)).toBeInTheDocument()
  })

  it('renders the unique selling point', () => {
    render(<CoachSection />)
    expect(screen.getByText(/tschetschenisch/i)).toBeInTheDocument()
  })
})
