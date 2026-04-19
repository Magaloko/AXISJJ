import { Hero } from '@/components/public/Hero'
import { StatsBar } from '@/components/public/StatsBar'
import { ScheduleWidget, type PublicDaySchedule } from '@/components/public/ScheduleWidget'
import { CoachSection } from '@/components/public/CoachSection'
import { ProgramsGrid } from '@/components/public/ProgramsGrid'
import { LandingPricing } from '@/components/public/LandingPricing'
import { TrialCTA } from '@/components/public/TrialCTA'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, addDays, format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AXIS Jiu-Jitsu Vienna — BJJ Gym in Wien',
  description:
    'Trainiere Brazilian Jiu-Jitsu in Wien. Gi, No-Gi, Kids, Fundamentals. Österreichs erster tschetschenischer Schwarzgurt als Head Coach. 1 Woche kostenlos testen.',
}

async function getWeekSchedule(): Promise<PublicDaySchedule[]> {
  const supabase = await createClient()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 1 })

  const { data } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, coach_id,
      class_types(name, level, gi),
      profiles!class_sessions_coach_id_fkey(full_name)
    `)
    .eq('cancelled', false)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at', { ascending: true })

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
    const coachProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles

    days[dayIndex].sessions.push({
      id:      s.id,
      name:    classType?.name ?? 'Training',
      time:    format(sessionDate, 'HH:mm'),
      endTime: format(parseISO(s.ends_at), 'HH:mm'),
      level:   (classType?.level ?? 'all') as PublicDaySchedule['sessions'][number]['level'],
      gi:      classType?.gi ?? true,
      trainer: coachProfile?.full_name ?? 'AXIS Coach',
    })
  }

  return days
}

export default async function HomePage() {
  const schedule = await getWeekSchedule()

  return (
    <>
      <TrialCTA />
      <StatsBar />
      <CoachSection />
      <ProgramsGrid />
      <LandingPricing />
      <ScheduleWidget schedule={schedule} />
      <Hero />
    </>
  )
}
