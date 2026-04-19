'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { trainingLogSchema, type TrainingLogInput } from './training-log.schema'
import { computeStats, type TrainingStats } from './training-log-stats'

export type { TrainingStats }

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

