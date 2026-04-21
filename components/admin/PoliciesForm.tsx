'use client'

import { useState, useTransition } from 'react'
import { updatePolicies } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import type { GymSettings } from '@/lib/gym-settings'
import { translations, type Lang } from '@/lib/i18n'

interface Props { initial: GymSettings; lang: Lang }

export function PoliciesForm({ initial, lang }: Props) {
  const tg = translations[lang].admin.gym
  const [form, setForm] = useState({
    house_rules: initial.house_rules ?? '',
    cancellation_policy: initial.cancellation_policy ?? '',
    pricing_info: initial.pricing_info ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updatePolicies({
        house_rules: form.house_rules || null,
        cancellation_policy: form.cancellation_policy || null,
        pricing_info: form.pricing_info || null,
      })
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  const ta = 'w-full border border-border bg-background p-2 text-sm font-mono'
  const label = 'mb-1 block text-xs text-muted-foreground'

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{tg.policies}</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">{tg.saved}</p>}
      <div className="space-y-4">
        <div>
          <label className={label}>{tg.houseRules}</label>
          <textarea rows={8} className={ta} value={form.house_rules}
                    onChange={e => setForm({ ...form, house_rules: e.target.value })} />
        </div>
        <div>
          <label className={label}>{tg.cancellationPolicy}</label>
          <textarea rows={4} className={ta} value={form.cancellation_policy}
                    onChange={e => setForm({ ...form, cancellation_policy: e.target.value })} />
        </div>
        <div>
          <label className={label}>{tg.pricingInfo}</label>
          <textarea rows={6} className={ta} value={form.pricing_info}
                    onChange={e => setForm({ ...form, pricing_info: e.target.value })} />
        </div>
      </div>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        {tg.save}
      </button>
    </div>
  )
}
