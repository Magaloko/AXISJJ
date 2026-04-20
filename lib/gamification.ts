import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Client = SupabaseClient<Database>

type XpSource = Database['public']['Tables']['xp_events']['Row']['source']

/**
 * Level curve: L = floor(sqrt(totalXp / 50))
 *   L 0 →    0 XP     (just joined)
 *   L 1 →   50 XP
 *   L 2 →  200 XP
 *   L 3 →  450 XP
 *   L 4 →  800 XP
 *   L 5 → 1250 XP
 * Each level requires progressively more XP so mid/late-game stays meaningful.
 */
export function xpToLevel(totalXp: number): number {
  if (totalXp <= 0) return 0
  return Math.floor(Math.sqrt(totalXp / 50))
}

export function xpForLevel(level: number): number {
  return level * level * 50
}

export function progressToNextLevel(totalXp: number): { level: number; current: number; needed: number; pct: number } {
  const level = xpToLevel(totalXp)
  const floor = xpForLevel(level)
  const next  = xpForLevel(level + 1)
  const needed = next - floor
  const current = totalXp - floor
  const pct = needed > 0 ? Math.min(100, Math.round((current / needed) * 100)) : 0
  return { level, current, needed, pct }
}

interface AwardXpInput {
  profileId: string
  source: XpSource
  sourceId?: string | null
  amount: number
  description?: string
}

export async function awardXp(supabase: Client, input: AwardXpInput): Promise<void> {
  if (input.amount <= 0) return
  await supabase.from('xp_events').insert({
    profile_id:  input.profileId,
    source:      input.source,
    source_id:   input.sourceId ?? null,
    amount:      input.amount,
    description: input.description ?? null,
  })
}

export async function getTotalXp(supabase: Client, profileId: string): Promise<number> {
  const { data } = await supabase
    .from('xp_events')
    .select('amount')
    .eq('profile_id', profileId)
  return (data ?? []).reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Checks all badge criteria for a member and grants newly-earned ones.
 * Also awards the badge's XP reward via xp_events (chained).
 *
 * Criteria are hardcoded here because they depend on joining several tables.
 * Adding a new badge = add a row to `badges` + add its check here.
 */
export async function checkAndGrantBadges(supabase: Client, profileId: string): Promise<string[]> {
  const [{ data: earned }, { data: catalog }] = await Promise.all([
    supabase.from('member_badges').select('badge_id').eq('profile_id', profileId),
    supabase.from('badges').select('id, code, xp_reward'),
  ])
  const earnedIds = new Set((earned ?? []).map(b => b.badge_id))
  const byCode = new Map((catalog ?? []).map(b => [b.code, b] as const))

  // Gather stats in parallel
  const [
    quizAttemptsRes,
    quizPassesRes,
    taskCompletionsRes,
    ruleCorrectRes,
    totalXp,
  ] = await Promise.all([
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('passed', true),
    supabase.from('task_completions').select('task_id', { count: 'exact', head: true }).eq('profile_id', profileId),
    supabase.from('rule_card_attempts').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('is_correct', true),
    getTotalXp(supabase, profileId),
  ])

  const quizAttempts    = quizAttemptsRes.count ?? 0
  const quizPasses      = quizPassesRes.count ?? 0
  const taskCompletions = taskCompletionsRes.count ?? 0
  const ruleCorrect     = ruleCorrectRes.count ?? 0

  const candidates: { code: string; condition: boolean }[] = [
    { code: 'first_quiz',   condition: quizAttempts    >= 1   },
    { code: 'first_pass',   condition: quizPasses      >= 1   },
    { code: 'quiz_master',  condition: quizPasses      >= 10  },
    { code: 'task_starter', condition: taskCompletions >= 1   },
    { code: 'task_grinder', condition: taskCompletions >= 20  },
    { code: 'rule_scholar', condition: ruleCorrect     >= 10  },
    { code: 'rule_expert',  condition: ruleCorrect     >= 50  },
    { code: 'centurion',    condition: totalXp         >= 100 },
  ]

  const newlyEarned: string[] = []
  for (const c of candidates) {
    const badge = byCode.get(c.code)
    if (!badge) continue
    if (earnedIds.has(badge.id)) continue
    if (!c.condition) continue

    const { error } = await supabase.from('member_badges').insert({
      profile_id: profileId,
      badge_id:   badge.id,
    })
    if (!error) {
      newlyEarned.push(c.code)
      if (badge.xp_reward > 0) {
        await awardXp(supabase, {
          profileId,
          source: 'badge_earned',
          sourceId: badge.id,
          amount: badge.xp_reward,
          description: `Badge: ${c.code}`,
        })
      }
    }
  }

  return newlyEarned
}
