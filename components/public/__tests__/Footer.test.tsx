import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Footer } from '../Footer'

describe('Footer', () => {
  it('renders gym address', () => {
    render(<Footer />)
    expect(screen.getByText(/strindberggasse/i)).toBeInTheDocument()
  })

  it('renders Instagram link', () => {
    render(<Footer />)
    expect(screen.getByText(/@axisjj_at/i)).toBeInTheDocument()
  })

  it('renders Impressum and Datenschutz links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /impressum/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /datenschutz/i })).toBeInTheDocument()
  })
})
