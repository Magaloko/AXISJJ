import { describe, it, expect } from 'vitest'
import { SCHEDULE, type ScheduleDay } from '../schedule-data'

describe('SCHEDULE static data', () => {
  it('has entries for all 7 days', () => {
    expect(SCHEDULE).toHaveLength(7)
  })
  it('each day has label, short, and classes array', () => {
    SCHEDULE.forEach((day: ScheduleDay) => {
      expect(day).toHaveProperty('label')
      expect(day).toHaveProperty('short')
      expect(day).toHaveProperty('classes')
      expect(Array.isArray(day.classes)).toBe(true)
    })
  })
  it('each class has name, time, level, and gi fields', () => {
    const allClasses = SCHEDULE.flatMap(d => d.classes)
    allClasses.forEach(cls => {
      expect(cls).toHaveProperty('name')
      expect(cls).toHaveProperty('time')
      expect(cls).toHaveProperty('level')
      expect(cls).toHaveProperty('gi')
    })
  })
})
