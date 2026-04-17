// lib/utils/__tests__/belt.test.ts
import { describe, it, expect } from 'vitest'
import { calcReadiness } from '../belt'

describe('calcReadiness', () => {
  it('returns 100 when both requirements met', () => {
    expect(calcReadiness(100, 100, 12, 12)).toBe(100)
  })

  it('returns 50 when half the sessions done and no time requirement', () => {
    // minTimeMonths null → time component = 50 (fully met)
    // sessions: 25/100 → 25/100 * 50 = 12.5 → total = 62.5 → 63
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

  it('returns 50 when sessions are 0 and no time requirement', () => {
    // s = 0/100 * 50 = 0, t = 50, total = 50
    expect(calcReadiness(0, 100, 0, null)).toBe(50)
  })

  it('rounds down for fractional result', () => {
    // s = 40/100 * 50 = 20, t = 50, total = 70
    expect(calcReadiness(40, 100, 0, null)).toBe(70)
  })

  it('throws for minSessions = 0', () => {
    expect(() => calcReadiness(50, 0, 6, null)).toThrow(RangeError)
  })

  it('throws for minTimeMonths = 0', () => {
    expect(() => calcReadiness(50, null, 6, 0)).toThrow(RangeError)
  })
})
