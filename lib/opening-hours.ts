import type { DayKey, OpeningHours } from './gym-settings'

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const DAY_LABELS_DE: Record<DayKey, string> = {
  mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So',
}

export const DAY_LABELS_FULL_DE: Record<DayKey, string> = {
  mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag',
  fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag',
}

export function dayKeyOf(date: Date): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7]
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  const today = hours[dayKeyOf(now)]
  if (today.closed || !today.open || !today.close) return false
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= toMinutes(today.open) && nowMin < toMinutes(today.close)
}

export interface NextOpening {
  dayKey: DayKey
  time: string
  isToday: boolean
}

export function nextOpeningTime(hours: OpeningHours, now: Date): NextOpening | null {
  const todayKey = dayKeyOf(now)
  const today = hours[todayKey]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (!today.closed && today.open && nowMin < toMinutes(today.open)) {
    return { dayKey: todayKey, time: today.open, isToday: true }
  }

  const startIdx = DAY_KEYS.indexOf(todayKey)
  for (let offset = 1; offset <= 7; offset++) {
    const key = DAY_KEYS[(startIdx + offset) % 7]
    const day = hours[key]
    if (!day.closed && day.open) {
      return { dayKey: key, time: day.open, isToday: false }
    }
  }
  return null
}

export interface DayRange {
  days: DayKey[]
  open: string
  close: string
}

export function groupIntoRanges(hours: OpeningHours): { ranges: DayRange[]; closedDays: DayKey[] } {
  const ranges: DayRange[] = []
  const closedDays: DayKey[] = []
  let currentRange: DayRange | null = null

  for (const key of DAY_KEYS) {
    const day = hours[key]
    if (day.closed || !day.open || !day.close) {
      closedDays.push(key)
      currentRange = null
      continue
    }
    if (currentRange && currentRange.open === day.open && currentRange.close === day.close) {
      currentRange.days.push(key)
    } else {
      currentRange = { days: [key], open: day.open, close: day.close }
      ranges.push(currentRange)
    }
  }
  return { ranges, closedDays }
}
