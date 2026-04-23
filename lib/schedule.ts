import { createClient } from '@/lib/supabase/server'
import { parseISO } from 'date-fns'
import type { PublicDaySchedule } from '@/components/public/ScheduleWidget'

const TZ = 'Europe/Vienna'

// Extract wall-clock parts in a specific timezone
function partsInTZ(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value
    return acc
  }, {})
  return {
    year:    Number(parts.year),
    month:   Number(parts.month),
    day:     Number(parts.day),
    weekday: parts.weekday,   // 'Mon', 'Tue', ...
    hour:    parts.hour === '24' ? '00' : parts.hour,
    minute:  parts.minute,
  }
}

// Map English short weekday (Mon=0..Sun=6)
const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
}

// German labels
const DAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAY_SHORT  = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']

export async function getWeekSchedule(): Promise<PublicDaySchedule[]> {
  const supabase = await createClient()

  // Compute week range in Vienna timezone, then convert to UTC for DB query
  const now = new Date()
  const nowParts = partsInTZ(now, TZ)
  const nowWeekdayIdx = WEEKDAY_INDEX[nowParts.weekday] ?? 0

  // Construct "Monday 00:00 Vienna" for the current week
  // Use Date.UTC and then offset — safer: iterate via day-of-month
  const nowLocal = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0))
  // Shift back to Monday
  const weekStartLocal = new Date(nowLocal)
  weekStartLocal.setUTCDate(weekStartLocal.getUTCDate() - nowWeekdayIdx)
  const weekEndLocal = new Date(weekStartLocal)
  weekEndLocal.setUTCDate(weekEndLocal.getUTCDate() + 7)

  // Broaden query range by ±1 day to safely cover timezone edges
  const queryStart = new Date(weekStartLocal.getTime() - 24 * 60 * 60 * 1000)
  const queryEnd   = new Date(weekEndLocal.getTime() + 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, coach_id,
      class_types(name, level, gi)
    `)
    .eq('cancelled', false)
    .gte('starts_at', queryStart.toISOString())
    .lte('starts_at', queryEnd.toISOString())
    .order('starts_at', { ascending: true })

  const coachIds = Array.from(
    new Set((data ?? []).map(s => s.coach_id).filter((id): id is string => !!id))
  )
  const coachNameById = new Map<string, string>()
  if (coachIds.length > 0) {
    const { data: coaches } = await supabase
      .from('public_coaches')
      .select('id, full_name')
      .in('id', coachIds)
    for (const c of coaches ?? []) {
      if (c.full_name) coachNameById.set(c.id, c.full_name)
    }
  }

  // Build Monday..Sunday with Vienna-local date labels
  const days: PublicDaySchedule[] = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(weekStartLocal)
    dayDate.setUTCDate(dayDate.getUTCDate() + i)
    const dateStr = `${String(dayDate.getUTCDate()).padStart(2, '0')}.${String(dayDate.getUTCMonth() + 1).padStart(2, '0')}`
    return {
      dayLabel: DAY_LABELS[i],
      dayShort: DAY_SHORT[i],
      dateLabel: dateStr,       // NEW: e.g. "27.04"
      isoDate: `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dayDate.getUTCDate()).padStart(2, '0')}`,
      sessions: [],
    }
  })

  for (const s of data ?? []) {
    const sessionDate = parseISO(s.starts_at)
    const endDate     = parseISO(s.ends_at)
    const sParts      = partsInTZ(sessionDate, TZ)
    const eParts      = partsInTZ(endDate, TZ)

    const dayIndex = WEEKDAY_INDEX[sParts.weekday]
    if (dayIndex === undefined) continue

    // Match by actual Vienna-local date (robust against week boundary + DST)
    const sessionIsoDate = `${sParts.year}-${String(sParts.month).padStart(2, '0')}-${String(sParts.day).padStart(2, '0')}`
    const targetDay = days.find(d => d.isoDate === sessionIsoDate)
    if (!targetDay) continue

    const classType = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
    const coachName = s.coach_id ? coachNameById.get(s.coach_id) : null

    targetDay.sessions.push({
      id:      s.id,
      name:    classType?.name ?? 'Training',
      time:    `${sParts.hour}:${sParts.minute}`,
      endTime: `${eParts.hour}:${eParts.minute}`,
      level:   (classType?.level ?? 'all') as PublicDaySchedule['sessions'][number]['level'],
      gi:      classType?.gi ?? true,
      trainer: coachName ?? 'AXIS Coach',
    })
  }

  return days
}
