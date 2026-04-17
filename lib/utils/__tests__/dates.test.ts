import { describe, it, expect } from 'vitest'
import { formatTime, formatDateShort, getNextSevenDays, getDayLabel } from '../dates'

describe('dates utils', () => {
  it('formatTime returns HH:mm string', () => {
    const result = formatTime('2026-04-17T08:00:00.000Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('formatDateShort returns abbreviated date', () => {
    const result = formatDateShort('2026-04-17T08:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('getNextSevenDays returns exactly 7 Date objects', () => {
    const days = getNextSevenDays()
    expect(days).toHaveLength(7)
    expect(days[0]).toBeInstanceOf(Date)
  })

  it('getDayLabel returns Heute for today', () => {
    expect(getDayLabel(new Date())).toBe('Heute')
  })

  it('getDayLabel returns Morgen for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(getDayLabel(tomorrow)).toBe('Morgen')
  })
})
