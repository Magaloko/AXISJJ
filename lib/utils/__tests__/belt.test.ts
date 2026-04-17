// lib/utils/__tests__/belt.test.ts
import { describe, it, expect } from 'vitest'
import { calcReadiness } from '../belt'

describe('calcReadiness', () => {
  it('returns 100 when both requirements met', () => {
    expect(calcReadiness(100, 100, 12, 12)).toBe(100)
  })

  it('returns 50 when half the sessions done and no time requirement', () => {
    // minTimeMonths null → time component = 50 (fully met)
    // sessions: 25/100 → 25/100 * 50 = 12.5 → total = 62 (rounded)
    expect(calcReadiness(25, 100, 0, null)).toBe(63)
  })

  it('returns 0 when no requirements defined', () => {
    expect(calcReadiness(50, null, 6, null)).toBe(0)
  })

  it('caps at 100 when over-qualified', () => {
    expect(calcReadiness(200, 100, 24, 12)).toBe(100)
  })

  it('handles only session requirement', () => {
    // minTimeMonths null → time = 50, sessions 50/100 = 25, total = 75
    expect(calcReadiness(50, 100, 0, null)).toBe(75)
  })

  it('handles only time requirement', () => {
    // minSessions null → sessions = 50, months 6/12 = 25, total = 75
    expect(calcReadiness(0, null, 6, 12)).toBe(75)
  })
})
