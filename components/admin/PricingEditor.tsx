'use client'

import { useState, useTransition } from 'react'
import { updatePricingPlan } from '@/app/actions/pricing'
import { translations, type Lang } from '@/lib/i18n'

interface Plan {
  id: string
  category: 'students' | 'adults' | 'kids'
  duration_months: number
  price_per_month: number
  total_price: number | null
  highlighted: boolean
}

interface Props { plans: Plan[]; lang: Lang }

export function PricingEditor({ plans: initialPlans, lang }: Props) {
  const tex = translations[lang].admin.einstellungenExtra
  const [plans, setPlans] = useState(initialPlans)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const CATEGORY_LABELS: Record<string, string> = {
    students: tex.catStudents,
    adults: tex.catAdults,
    kids: tex.catKids,
  }

  function updateLocal(id: string, patch: Partial<Plan>) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  function handleSave(plan: Plan) {
    setPendingId(plan.id)
    setMessage(null)
    startTransition(async () => {
      const result = await updatePricingPlan({
        id: plan.id,
        price_per_month: Number(plan.price_per_month),
        total_price: plan.total_price !== null ? Number(plan.total_price) : null,
        highlighted: plan.highlighted,
      })
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: tex.saved })
      }
      setPendingId(null)
    })
  }

  // Group by category
  const grouped = plans.reduce<Record<string, Plan[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  const inputCls = 'w-20 border border-border bg-background px-2 py-1 text-xs font-mono outline-none focus:border-primary'

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{tex.pricingTitle}</p>
      <p className="mb-5 text-sm text-muted-foreground">
        {tex.pricingSubtext}
      </p>

      {message && (
        <p className={`mb-3 text-sm ${message.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
          {message.text}
        </p>
      )}

      <div className="space-y-6">
        {(['students', 'adults', 'kids'] as const).map(cat => (
          <div key={cat}>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3 text-xs text-muted-foreground">{tex.duration}</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground">{tex.pricePerMonth}</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground">{tex.totalPrice}</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground">{tex.highlighted}</th>
                    <th className="py-2 text-right text-xs text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {(grouped[cat] ?? []).sort((a, b) => b.duration_months - a.duration_months).map(plan => (
                    <tr key={plan.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-semibold text-foreground">{plan.duration_months} {tex.months}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number" step="0.01" min={0}
                          value={plan.price_per_month}
                          onChange={e => updateLocal(plan.id, { price_per_month: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number" step="0.01" min={0}
                          value={plan.total_price ?? ''}
                          placeholder="—"
                          onChange={e => updateLocal(plan.id, {
                            total_price: e.target.value === '' ? null : Number(e.target.value),
                          })}
                          className={`${inputCls} w-24`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={plan.highlighted}
                          onChange={e => updateLocal(plan.id, { highlighted: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleSave(plan)}
                          disabled={isPending && pendingId === plan.id}
                          className="bg-primary px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {pendingId === plan.id && isPending ? '...' : tex.save}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
