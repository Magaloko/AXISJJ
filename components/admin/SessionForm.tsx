// components/admin/SessionForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertSession, type SessionFormData } from '@/app/actions/sessions'

interface ClassType { id: string; name: string }

interface Props {
  initialData?: Partial<SessionFormData>
  classTypes: ClassType[]
  onSuccess: (session: Record<string, unknown>) => void
  onCancel: () => void
}

export function SessionForm({ initialData, classTypes, onSuccess, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    id: initialData?.id ?? '',
    class_type_id: initialData?.class_type_id ?? (classTypes[0]?.id ?? ''),
    date: initialData?.starts_at ? initialData.starts_at.split('T')[0] : today,
    startTime: initialData?.starts_at ? initialData.starts_at.substring(11, 16) : '18:00',
    endTime: initialData?.ends_at ? initialData.ends_at.substring(11, 16) : '19:30',
    capacity: initialData?.capacity ?? 16,
    location: initialData?.location ?? 'AXIS Gym',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.startTime >= form.endTime) {
      setError('Endzeit muss nach der Startzeit liegen.')
      return
    }
    startTransition(async () => {
      const data: SessionFormData = {
        ...(form.id ? { id: form.id } : {}),
        class_type_id: form.class_type_id,
        starts_at: `${form.date}T${form.startTime}:00`,
        ends_at: `${form.date}T${form.endTime}:00`,
        capacity: Number(form.capacity),
        location: form.location,
      }
      const result = await upsertSession(data)
      if (result.error) { setError(result.error); return }
      onSuccess(result.session!)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Kursart
        </label>
        <select
          value={form.class_type_id}
          onChange={e => setForm(f => ({ ...f, class_type_id: e.target.value }))}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
          required
        >
          {classTypes.map(ct => (
            <option key={ct.id} value={ct.id}>{ct.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Datum
        </label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Startzeit
          </label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Endzeit
          </label>
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Kapazität
        </label>
        <input
          type="number"
          min={1}
          max={99}
          value={form.capacity}
          onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Ort
        </label>
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {error && (
        <p className="text-sm font-semibold text-destructive">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          {isPending ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-border px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
