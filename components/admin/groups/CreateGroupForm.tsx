'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTrainingGroup } from '@/app/actions/training-groups'

const COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#db2777',
]

interface Props {
  coaches: { id: string; name: string | null }[]
}

export function CreateGroupForm({ coaches }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coachId, setCoachId] = useState('')
  const [color, setColor] = useState('#dc2626')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputClass = 'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich.'); return }
    setSaving(true); setError('')
    const res = await createTrainingGroup({ name, description: description || undefined, coach_id: coachId || undefined, color })
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    router.push(`/admin/gruppen/${res.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="z.B. Montags-Gi" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Beschreibung</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Verantwortlicher Coach</label>
        <select value={coachId} onChange={e => setCoachId(e.target.value)} className={inputClass}>
          <option value="">— kein Coach zugewiesen —</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Farbe</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'white' : 'transparent',
                outline: color === c ? `2px solid ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {saving ? 'Wird gespeichert…' : 'Gruppe erstellen →'}
      </button>
    </form>
  )
}
