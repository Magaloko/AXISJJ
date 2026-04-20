'use client'

import { useState, useTransition } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { submitRuleCardAnswer } from '@/app/actions/rule-cards'

interface Card {
  id: string
  category: 'scoring' | 'illegal' | 'time' | 'belt' | 'etiquette'
  question: string
  options: string[]
  difficulty: 'white' | 'blue' | 'purple' | 'brown' | 'black'
  xp_reward: number
}

const CATEGORY_LABEL: Record<Card['category'], string> = {
  scoring:   'Scoring',
  illegal:   'Illegal',
  time:      'Zeit',
  belt:      'Gürtel',
  etiquette: 'Etikette',
}

const BELT_BG: Record<Card['difficulty'], string> = {
  white:  'bg-white text-black border-black',
  blue:   'bg-blue-600 text-white',
  purple: 'bg-purple-700 text-white',
  brown:  'bg-amber-800 text-white',
  black:  'bg-black text-white',
}

export function RuleCardGame({ initial }: { initial: Card }) {
  const [card, setCard] = useState<Card>(initial)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<{ is_correct: boolean; correct_index: number; explanation: string; xpEarned: number; newBadges: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingNext, setLoadingNext] = useState(false)

  function onPick(i: number) {
    if (result) return
    setSelected(i)
  }

  function onSubmit() {
    if (selected === null) return
    setError(null)
    startTransition(async () => {
      const r = await submitRuleCardAnswer({ rule_card_id: card.id, selected_index: selected })
      if (r.error) {
        setError(r.error)
      } else {
        setResult({
          is_correct:   r.is_correct ?? false,
          correct_index: r.correct_index ?? 0,
          explanation:   r.explanation ?? '',
          xpEarned:      r.xpEarned ?? 0,
          newBadges:     r.newBadges ?? [],
        })
      }
    })
  }

  async function onNext() {
    setLoadingNext(true)
    setError(null)
    try {
      // Fetch a fresh random card via the API (re-uses same page load endpoint)
      const res = await fetch('/api/bjj-rules/random')
      if (!res.ok) {
        setError('Nächste Karte konnte nicht geladen werden.')
        return
      }
      const next = (await res.json()) as Card | { error: string }
      if ('error' in next) {
        setError(next.error)
        return
      }
      setCard(next)
      setSelected(null)
      setResult(null)
    } finally {
      setLoadingNext(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {CATEGORY_LABEL[card.category]}
          </span>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${BELT_BG[card.difficulty]}`}>
            {card.difficulty}
          </span>
        </div>

        <div className="p-6">
          <p className="mb-5 text-base font-semibold text-foreground">{card.question}</p>

          <div className="space-y-2">
            {card.options.map((opt, i) => {
              let cls = 'block w-full border px-4 py-3 text-left text-sm transition-colors'
              if (result) {
                if (i === result.correct_index) {
                  cls += ' border-primary bg-primary/10 font-bold text-foreground'
                } else if (i === selected) {
                  cls += ' border-destructive/50 bg-destructive/5 text-foreground'
                } else {
                  cls += ' border-border text-muted-foreground'
                }
              } else if (i === selected) {
                cls += ' border-primary bg-primary/5 text-foreground'
              } else {
                cls += ' border-border bg-background text-foreground hover:border-primary'
              }

              return (
                <button key={i} onClick={() => onPick(i)} disabled={!!result} className={cls}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{opt}</span>
                    {result && i === result.correct_index && <Check size={16} className="text-primary" />}
                    {result && i === selected && i !== result.correct_index && <X size={16} className="text-destructive" />}
                  </div>
                </button>
              )
            })}
          </div>

          {result && (
            <div className={
              result.is_correct
                ? 'mt-5 border border-primary bg-primary/5 p-4'
                : 'mt-5 border border-border bg-muted p-4'
            }>
              <p className="text-sm font-bold text-foreground">
                {result.is_correct ? '✓ Richtig!' : '✗ Knapp daneben'}
                {result.xpEarned > 0 && (
                  <span className="ml-2 text-primary">+{result.xpEarned} XP</span>
                )}
              </p>
              {result.newBadges.length > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Sparkles size={12} /> {result.newBadges.length} neue{result.newBadges.length === 1 ? 's' : ''} Badge!
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{result.explanation}</p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-xs text-muted-foreground">Karte: {card.xp_reward} XP</p>
          {!result ? (
            <button
              onClick={onSubmit}
              disabled={isPending || selected === null}
              className="bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              {isPending ? 'Prüfe…' : 'Antwort abgeben'}
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={loadingNext}
              className="bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              {loadingNext ? 'Lädt…' : 'Nächste Karte'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
