import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, addDays, format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { PublicDaySchedule } from '@/components/public/ScheduleWidget'

export async function getWeekSchedule(): Promise<PublicDaySchedule[]> {
  const supabase = await createClient()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 1 })

  const { data } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, coach_id,
      class_types(name, level, gi)
    `)
    .eq('cancelled', false)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
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

  const days: PublicDaySchedule[] = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i)
    return {
      dayLabel: format(day, 'EEEE', { locale: de }),
      dayShort: format(day, 'EEE', { locale: de }).toUpperCase().slice(0, 2),
      sessions: [],
    }
  })

  for (const s of data ?? []) {
    const sessionDate = parseISO(s.starts_at)
    const dayIndex = Math.round(
      (sessionDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (dayIndex < 0 || dayIndex > 6) continue

    const classType = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
    const coachName = s.coach_id ? coachNameById.get(s.coach_id) : null

    days[dayIndex].sessions.push({
      id:      s.id,
      name:    classType?.name ?? 'Training',
      time:    format(sessionDate, 'HH:mm'),
      endTime: format(parseISO(s.ends_at), 'HH:mm'),
      level:   (classType?.level ?? 'all') as PublicDaySchedule['sessions'][number]['level'],
      gi:      classType?.gi ?? true,
      trainer: coachName ?? 'AXIS Coach',
    })
  }

  return days
}
