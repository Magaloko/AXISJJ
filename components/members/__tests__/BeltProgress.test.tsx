// components/members/__tests__/BeltProgress.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BeltProgress } from '../BeltProgress'

const mockRank = {
  beltName: 'Blue',
  stripes: 2,
  colorHex: '#1d4ed8',
  readiness: 72,
  sessionsAttended: 87,
  monthsInGrade: 8,
}

describe('BeltProgress', () => {
  it('renders belt name', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByText('Blue Belt')).toBeInTheDocument()
  })

  it('renders readiness percentage', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByRole('img', { name: /72%/ })).toBeInTheDocument()
  })

  it('renders stripe count', () => {
    render(<BeltProgress {...mockRank} />)
    expect(screen.getByText('2 Stripes')).toBeInTheDocument()
  })

  it('renders empty state when no rank', () => {
    render(<BeltProgress beltName={null} stripes={0} colorHex={null} readiness={0} sessionsAttended={0} monthsInGrade={0} />)
    expect(screen.getByText(/kein rang/i)).toBeInTheDocument()
  })

  it('renders English month label when lang is en', () => {
    render(<BeltProgress {...mockRank} lang="en" />)
    expect(screen.getByText(/8 Months/)).toBeInTheDocument()
  })

  it('renders English empty state when lang is en', () => {
    render(<BeltProgress beltName={null} stripes={0} colorHex={null} readiness={0} sessionsAttended={0} monthsInGrade={0} lang="en" />)
    expect(screen.getByText(/no rank on file/i)).toBeInTheDocument()
  })
})
