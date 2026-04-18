import { describe, it, expect } from 'vitest'
import {
  dayKeyOf, isOpenNow, nextOpeningTime, groupIntoRanges, DAY_KEYS,
} from '../opening-hours'
import type { OpeningHours } from '../gym-settings'

const fullWeek: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

describe('dayKeyOf', () => {
  it('maps JS Date to Monday-first DayKey', () => {
    expect(dayKeyOf(new Date('2026-04-20T12:00:00'))).toBe('mon')
    expect(dayKeyOf(new Date('2026-04-26T12:00:00'))).toBe('sun')
    expect(dayKeyOf(new Date('2026-04-25T12:00:00'))).toBe('sat')
  })
})

describe('isOpenNow', () => {
  it('returns true when within hours', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T17:00:00'))).toBe(true)
  })
  it('returns false before opening', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T10:00:00'))).toBe(false)
  })
  it('returns false after closing', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T23:00:00'))).toBe(false)
  })
  it('returns false on closed day', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-26T12:00:00'))).toBe(false)
  })
  it('returns true at open boundary inclusive', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T16:00:00'))).toBe(true)
  })
  it('returns false at close boundary exclusive', () => {
    expect(isOpenNow(fullWeek, new Date('2026-04-20T22:00:00'))).toBe(false)
  })
})

describe('nextOpeningTime', () => {
  it('returns today later if gym not yet open', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-20T10:00:00'))
    expect(result).toEqual({ dayKey: 'mon', time: '16:00', isToday: true })
  })
  it('returns tomorrow after today closes', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-20T23:00:00'))
    expect(result).toEqual({ dayKey: 'tue', time: '16:00', isToday: false })
  })
  it('skips closed day (Sunday) to Monday', () => {
    const result = nextOpeningTime(fullWeek, new Date('2026-04-26T12:00:00'))
    expect(result).toEqual({ dayKey: 'mon', time: '16:00', isToday: false })
  })
  it('returns null when every day is closed', () => {
    const allClosed = Object.fromEntries(
      DAY_KEYS.map(k => [k, { open: null, close: null, closed: true }])
    ) as OpeningHours
    expect(nextOpeningTime(allClosed, new Date('2026-04-20T10:00:00'))).toBeNull()
  })
})

describe('groupIntoRanges', () => {
  it('groups Mo-Fr when same hours', () => {
    const { ranges, closedDays } = groupIntoRanges(fullWeek)
    expect(ranges).toEqual([
      { days: ['mon', 'tue', 'wed', 'thu', 'fri'], open: '16:00', close: '22:00' },
      { days: ['sat'], open: '10:00', close: '14:00' },
    ])
    expect(closedDays).toEqual(['sun'])
  })
  it('returns empty ranges for all-closed gym', () => {
    const allClosed = Object.fromEntries(
      DAY_KEYS.map(k => [k, { open: null, close: null, closed: true }])
    ) as OpeningHours
    const { ranges, closedDays } = groupIntoRanges(allClosed)
    expect(ranges).toEqual([])
    expect(closedDays).toEqual([...DAY_KEYS])
  })
})
