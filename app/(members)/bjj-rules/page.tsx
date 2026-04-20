import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RuleCardGame } from '@/components/members/RuleCardGame'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'BJJ Regeln | AXIS' }

export default async function BjjRulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [statsRes, firstCardRes] = await Promise.all([
    supabase
      .from('rule_card_attempts')
      .select('is_correct')
      .eq('profile_id', user.id),
    supabase
      .from('rule_cards')
      .select('id, category, question, options, difficulty, xp_reward')
      .limit(100),
  ])

  const attempts = statsRes.data ?? []
  const totalAnswered = attempts.length
  const correctCount = attempts.filter(a => a.is_correct).length

  // Pick a random card client-side from the pool
  const initialCard = firstCardRes.data?.[Math.floor(Math.random() * (firstCardRes.data?.length ?? 1))] ?? null

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">BJJ Regel-Training</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          IBJJF-Regelkarten beantworten. +2 XP pro erstmals richtiger Antwort.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Dein Score: <span className="font-bold text-foreground">{correctCount}</span> richtig von <span className="font-bold text-foreground">{totalAnswered}</span> Versuchen
        </p>
      </div>

      {initialCard ? (
        <RuleCardGame initial={initialCard} />
      ) : (
        <div className="border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Keine Regelkarten verfügbar.
        </div>
      )}
    </div>
  )
}
