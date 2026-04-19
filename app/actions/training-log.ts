'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { trainingLogSchema, type TrainingLogInput } from './training-log.schema'

export async function logTraining(
  data: TrainingLogInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = trainingLogSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: log, error } = await supabase
    .from('training_logs')
    .insert({
      profile_id:   user.id,
      session_id:   parsed.data.session_id ?? null,
      mood_before:  parsed.data.mood_before,
      mood_after:   parsed.data.mood_after ?? null,
      energy:       parsed.data.energy ?? null,
      technique:    parsed.data.technique ?? null,
      conditioning: parsed.data.conditioning ?? null,
      mental:       parsed.data.mental ?? null,
      focus_areas:  parsed.data.focus_areas,
      notes:        parsed.data.notes ?? null,
      next_goal:    parsed.data.next_goal ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Speichern fehlgeschlagen.' }

  revalidatePath('/dashboard')
  return { success: true, id: log.id }
}

export interface TrainingStats {
  totalSessions: number
  currentStreak: number
  avgMoodLift: number | null
  lastSessionDate: string | null
  weeklyFrequency: { week: string; count: number }[]
  moodTrend: { date: string; mood_before: number; mood_after: number | null }[]
  radarAvg: { technique: number; conditioning: number; mental: number } | null
  lastGoal: string | null
}

export async function getTrainingStats(): Promise<TrainingStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const empty: TrainingStats = {
    totalSessions: 0, currentStreak: 0, avgMoodLift: null,
    lastSessionDate: null, weeklyFrequency: [], moodTrend: [],
    radarAvg: null, lastGoal: null,
  }
  if (!user) return empty

  const { data: logs } = await supabase
    .from('training_logs')
    .select('id, logged_at, mood_before, mood_after, technique, conditioning, mental, next_goal')
    .eq('profile_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(100)

  if (!logs || logs.length === 0) return empty

  return computeStats(logs)
}

// Exported for unit testing
export function computeStats(logs: {
  logged_at: string
  mood_before: number
  mood_after: number | null
  technique: number | null
  conditioning: number | null
  mental: number | null
  next_goal: string | null
}[]): TrainingStats {
  if (logs.length === 0) {
    return { totalSessions: 0, currentStreak: 0, avgMoodLift: null, lastSessionDate: null, weeklyFrequency: [], moodTrend: [], radarAvg: null, lastGoal: null }
  }

  const totalSessions = logs.length
  const lastSessionDate = logs[0].logged_at
  const lastGoal = logs.find(l => l.next_goal)?.next_goal ?? null

  // Streak: consecutive calendar days from today backward
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const seenDays = new Set(logs.map(l => {
    const d = new Date(l.logged_at)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }))
  let streak = 0
  const check = new Date(today)
  while (seenDays.has(check.getTime())) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  // Avg mood lift
  const withAfter = logs.filter(l => l.mood_after !== null)
  const avgMoodLift = withAfter.length > 0
    ? Math.round((withAfter.reduce((a, l) => a + (l.mood_after! - l.mood_before), 0) / withAfter.length) * 10) / 10
    : null

  // Weekly frequency — 12 buckets, Mon-anchored
  const weekBuckets: Map<string, number> = new Map()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today)
    const dow = (d.getDay() + 6) % 7 // Mon = 0
    d.setDate(d.getDate() - dow - i * 7)
    weekBuckets.set(d.toISOString().split('T')[0], 0)
  }
  for (const log of logs) {
    const d = new Date(log.logged_at)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().split('T')[0]
    if (weekBuckets.has(key)) weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1)
  }
  const weeklyFrequency = Array.from(weekBuckets.entries()).map(([week, count]) => ({ week, count }))

  // Mood trend — last 20 logs, ascending
  const moodTrend = logs.slice(0, 20).map(l => ({
    date: l.logged_at.split('T')[0],
    mood_before: l.mood_before,
    mood_after: l.mood_after,
  })).reverse()

  // Radar avg — last 30 days
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - 30)
  const recent = logs.filter(l => new Date(l.logged_at) >= cutoff)
  const withScores = recent.filter(l => l.technique || l.conditioning || l.mental)
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
  const radarAvg = withScores.length > 0 ? {
    technique:    avg(withScores.map(l => l.technique).filter((v): v is number => v !== null)),
    conditioning: avg(withScores.map(l => l.conditioning).filter((v): v is number => v !== null)),
    mental:       avg(withScores.map(l => l.mental).filter((v): v is number => v !== null)),
  } : null

  return { totalSessions, currentStreak: streak, avgMoodLift, lastSessionDate, weeklyFrequency, moodTrend, radarAvg, lastGoal }
}
