'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { awardXp, checkAndGrantBadges } from '@/lib/gamification'

const submitSchema = z.object({
  rule_card_id:   z.string().uuid(),
  selected_index: z.number().int().min(0).max(10),
})

export interface RuleAnswerResult {
  is_correct?: boolean
  correct_index?: number
  explanation?: string
  xpEarned?: number
  newBadges?: string[]
  error?: string
}

export async function submitRuleCardAnswer(
  data: z.infer<typeof submitSchema>,
): Promise<RuleAnswerResult> {
  const parsed = submitSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: card } = await supabase
    .from('rule_cards')
    .select('correct_index, explanation, xp_reward')
    .eq('id', parsed.data.rule_card_id)
    .single()
  if (!card) return { error: 'Karte nicht gefunden.' }

  const is_correct = parsed.data.selected_index === card.correct_index

  // Award XP only on FIRST correct answer per card.
  let xpEarned = 0
  let newBadges: string[] = []

  const { data: prevCorrect } = await supabase
    .from('rule_card_attempts')
    .select('id')
    .eq('profile_id', user.id)
    .eq('rule_card_id', parsed.data.rule_card_id)
    .eq('is_correct', true)
    .limit(1)
    .maybeSingle()

  await supabase.from('rule_card_attempts').insert({
    profile_id:     user.id,
    rule_card_id:   parsed.data.rule_card_id,
    selected_index: parsed.data.selected_index,
    is_correct,
  })

  if (is_correct && !prevCorrect) {
    xpEarned = card.xp_reward
    await awardXp(supabase, {
      profileId:   user.id,
      source:      'rule_correct',
      sourceId:    parsed.data.rule_card_id,
      amount:      card.xp_reward,
      description: 'BJJ-Regel richtig',
    })
    newBadges = await checkAndGrantBadges(supabase, user.id)
  }

  return {
    is_correct,
    correct_index: card.correct_index,
    explanation:   card.explanation,
    xpEarned,
    newBadges,
  }
}

export async function getRandomRuleCard(
  difficulty?: 'white' | 'blue' | 'purple' | 'brown' | 'black',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' as const }

  // Prefer cards the member hasn't answered correctly yet.
  const { data: correctlyAnswered } = await supabase
    .from('rule_card_attempts')
    .select('rule_card_id')
    .eq('profile_id', user.id)
    .eq('is_correct', true)

  const excludeIds = new Set((correctlyAnswered ?? []).map(a => a.rule_card_id))

  let query = supabase
    .from('rule_cards')
    .select('id, category, question, options, difficulty, xp_reward')
    .limit(50)
  if (difficulty) query = query.eq('difficulty', difficulty)

  const { data: cards } = await query
  if (!cards || cards.length === 0) return { error: 'Keine Regeln gefunden.' as const }

  // First try to find unseen cards; if none, allow repeats.
  const unseen = cards.filter(c => !excludeIds.has(c.id))
  const pool = unseen.length > 0 ? unseen : cards
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { card: pick }
}
