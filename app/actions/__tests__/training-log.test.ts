import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser: vi.fn() }, from: vi.fn() }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { computeStats } from '../training-log'

const today = new Date()
today.setHours(12, 0, 0, 0)

function daysAgo(n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const baseLogs = [
  { logged_at: daysAgo(0), mood_before: 2, mood_after: 4, technique: 3, conditioning: 4, mental: 3, next_goal: 'Work on guard' },
  { logged_at: daysAgo(1), mood_before: 3, mood_after: 4, technique: null, conditioning: null, mental: null, next_goal: null },
  { logged_at: daysAgo(2), mood_before: 1, mood_after: 3, technique: 4, conditioning: 3, mental: 5, next_goal: null },
]

describe('computeStats', () => {
  it('counts total sessions', () => {
    const stats = computeStats(baseLogs)
    expect(stats.totalSessions).toBe(3)
  })

  it('computes streak for consecutive days', () => {
    const stats = computeStats(baseLogs)
    expect(stats.currentStreak).toBe(3)
  })

  it('breaks streak when a day is missing', () => {
    const gapLogs = [
      { logged_at: daysAgo(0), mood_before: 3, mood_after: 4, technique: null, conditioning: null, mental: null, next_goal: null },
      { logged_at: daysAgo(2), mood_before: 2, mood_after: 3, technique: null, conditioning: null, mental: null, next_goal: null },
    ]
    expect(computeStats(gapLogs).currentStreak).toBe(1)
  })

  it('computes avg mood lift', () => {
    const stats = computeStats(baseLogs)
    // lifts: +2, +1, +2 → avg = 5/3 ≈ 1.7
    expect(stats.avgMoodLift).toBe(1.7)
  })

  it('returns null avgMoodLift when no mood_after entries', () => {
    const noAfter = baseLogs.map(l => ({ ...l, mood_after: null }))
    expect(computeStats(noAfter).avgMoodLift).toBeNull()
  })

  it('returns lastGoal from most recent log with a goal', () => {
    expect(computeStats(baseLogs).lastGoal).toBe('Work on guard')
  })

  it('returns null lastGoal when none set', () => {
    const noGoal = baseLogs.map(l => ({ ...l, next_goal: null }))
    expect(computeStats(noGoal).lastGoal).toBeNull()
  })

  it('returns 12 weekly frequency buckets', () => {
    const stats = computeStats(baseLogs)
    expect(stats.weeklyFrequency).toHaveLength(12)
  })

  it('returns mood trend ascending', () => {
    const stats = computeStats(baseLogs)
    expect(stats.moodTrend[0].date <= stats.moodTrend[1].date).toBe(true)
  })

  it('computes radar averages from recent logs', () => {
    const stats = computeStats(baseLogs)
    expect(stats.radarAvg).not.toBeNull()
    expect(stats.radarAvg!.technique).toBeGreaterThan(0)
  })
})
