'use client'

import { useState, useTransition } from 'react'
import { promoteToNextBelt } from '@/app/actions/promotions'
import type { PromotionReady } from '@/app/actions/admin'

interface Props {
  promotions: PromotionReady[]
}

export function PromotionsWidget({ promotions }: Props) {
  const [localPromotions, setLocalPromotions] = useState(promotions)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [donePromotions, setDonePromotions] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onPromote(profileId: string) {
    setError(null)
    startTransition(async () => {
      const result = await promoteToNextBelt(profileId)
      if (result.error) {
        setError(result.error)
        setConfirmId(null)
        return
      }
      setDonePromotions(prev => ({ ...prev, [profileId]: result.newBeltName ?? '✓' }))
      setConfirmId(null)
      setTimeout(() => {
        setLocalPromotions(prev => prev.filter(p => p.profileId !== profileId))
      }, 1500)
    })
  }

  if (localPromotions.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Gürtel Promotions
        </p>
        <p className="text-sm text-muted-foreground">Keine Promotions bereit</p>
      </div>
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Gürtel Promotions
        </p>
        <a href="/admin/guertel" className="text-xs font-bold text-primary">Alle →</a>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {localPromotions.map(p => {
          const done = donePromotions[p.profileId]
          const isConfirming = confirmId === p.profileId
          return (
            <li key={p.profileId} className={`flex items-center justify-between py-2 ${done ? 'opacity-50' : ''}`}>
              <div>
                <p className={`text-sm font-bold ${done ? 'line-through' : 'text-foreground'}`}>
                  {p.memberName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.currentBelt} → <span style={{ color: p.nextBeltColor ?? undefined }} className="font-bold">{p.nextBelt}</span>
                </p>
              </div>
              {done ? (
                <span className="bg-[#4caf50] px-2 py-1 text-[10px] font-bold text-white">✓ {done}</span>
              ) : isConfirming ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => onPromote(p.profileId)}
                    disabled={isPending}
                    className="bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground"
                  >
                    Abbr.
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(p.profileId)}
                  className="bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground"
                >
                  JETZT
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
