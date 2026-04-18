'use client'

import { useState, useTransition } from 'react'
import { updateOpeningHours } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import { DAY_KEYS, DAY_LABELS_FULL_DE } from '@/lib/opening-hours'
import type { OpeningHours } from '@/lib/gym-settings'

interface Props { initial: OpeningHours }

export function OpeningHoursForm({ initial }: Props) {
  const [hours, setHours] = useState<OpeningHours>(initial)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleClosed(key: typeof DAY_KEYS[number]) {
    setHours(prev => {
      const day = prev[key]
      if (day.closed) {
        return { ...prev, [key]: { open: '16:00', close: '22:00', closed: false } }
      }
      return { ...prev, [key]: { open: null, close: null, closed: true } }
    })
  }

  function updateTime(key: typeof DAY_KEYS[number], field: 'open' | 'close', value: string) {
    setHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updateOpeningHours(hours)
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">Gespeichert.</p>}
      <ul className="space-y-2">
        {DAY_KEYS.map(key => {
          const day = hours[key]
          return (
            <li key={key} className="flex items-center gap-3">
              <span className="w-24 text-sm font-bold">{DAY_LABELS_FULL_DE[key]}</span>
              <input type="time" value={day.open ?? ''} disabled={day.closed}
                     onChange={e => updateTime(key, 'open', e.target.value)}
                     className="border border-border bg-background p-1 text-sm disabled:opacity-40" />
              <span className="text-sm text-muted-foreground">–</span>
              <input type="time" value={day.close ?? ''} disabled={day.closed}
                     onChange={e => updateTime(key, 'close', e.target.value)}
                     className="border border-border bg-background p-1 text-sm disabled:opacity-40" />
              <label className="ml-auto flex items-center gap-2 text-xs">
                <input type="checkbox" checked={day.closed} onChange={() => toggleClosed(key)} />
                geschlossen
              </label>
            </li>
          )
        })}
      </ul>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Speichern
      </button>
    </div>
  )
}
