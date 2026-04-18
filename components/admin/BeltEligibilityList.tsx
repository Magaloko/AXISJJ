'use client'

import { useState, useTransition } from 'react'
import { promoteToNextBelt } from '@/app/actions/promotions'
import type { PromotionReady } from '@/app/actions/admin'

interface Props {
  eligible: PromotionReady[]
}

export function BeltEligibilityList({ eligible }: Props) {
  const [local, setLocal] = useState(eligible)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onPromote(profileId: string, name: string, nextBelt: string) {
    if (!confirm(`${name} zu ${nextBelt} befördern?`)) return
    setError(null)
    startTransition(async () => {
      const result = await promoteToNextBelt(profileId)
      if (result.error) { setError(result.error); return }
      setLocal(prev => prev.filter(p => p.profileId !== profileId))
    })
  }

  if (local.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Bereit zu promoten
        </p>
        <p className="text-sm text-muted-foreground">Keine Promotions bereit</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Bereit zu promoten ({local.length})
      </p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {local.map(p => (
          <li key={p.profileId} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-foreground">{p.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {p.currentBelt} → <span style={{ color: p.nextBeltColor ?? undefined }} className="font-bold">{p.nextBelt}</span>
                <span className="ml-2 font-mono">{p.sessions} Sessions · {p.months} Monate</span>
              </p>
            </div>
            <button
              onClick={() => onPromote(p.profileId, p.memberName, p.nextBelt)}
              disabled={isPending}
              className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              PROMOTEN
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
