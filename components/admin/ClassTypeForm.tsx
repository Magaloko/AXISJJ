'use client'

import { useState, useTransition } from 'react'
import { upsertClassType } from '@/app/actions/class-types'
import { useRouter } from 'next/navigation'

export interface ClassTypeRow {
  id?: string
  name: string
  description: string | null
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

interface Props { initial?: ClassTypeRow; onClose: () => void }

export function ClassTypeForm({ initial, onClose }: Props) {
  const [form, setForm] = useState<ClassTypeRow>(initial ?? { name: '', description: '', level: 'all', gi: true })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await upsertClassType({
        id: initial?.id,
        name: form.name,
        description: form.description ?? undefined,
        level: form.level,
        gi: form.gi,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{initial ? 'Klassentyp bearbeiten' : 'Neuer Klassentyp'}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Name"
               value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full border border-border bg-background p-2 text-sm" placeholder="Beschreibung" rows={3}
                  value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        <select className="w-full border border-border bg-background p-2 text-sm"
                value={form.level} onChange={e => setForm({ ...form, level: e.target.value as ClassTypeRow['level'] })}>
          <option value="beginner">Anfänger</option>
          <option value="all">Alle</option>
          <option value="advanced">Fortgeschritten</option>
          <option value="kids">Kids</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.gi} onChange={e => setForm({ ...form, gi: e.target.checked })} />
          Mit Gi
        </label>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            Speichern
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </div>
    </div>
  )
}
