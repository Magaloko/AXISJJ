// components/admin/SessionForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertSession, type SessionFormData } from '@/app/actions/sessions'
import type { Session, Coach } from './SessionCalendar'

interface ClassType { id: string; name: string }

interface Props {
  initialData?: Partial<SessionFormData & { coach_id?: string | null }>
  classTypes: ClassType[]
  coaches: Coach[]
  onSuccess: (session: Session) => void
  onCancel: () => void
}

export function SessionForm({ initialData, classTypes, coaches, onSuccess, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    id:            initialData?.id ?? '',
    class_type_id: initialData?.class_type_id ?? (classTypes[0]?.id ?? ''),
    coach_id:      initialData?.coach_id ?? '',
    date:          initialData?.starts_at ? initialData.starts_at.split('T')[0] : today,
    startTime:     initialData?.starts_at ? initialData.starts_at.substring(11, 16) : '18:00',
    endTime:       initialData?.ends_at   ? initialData.ends_at.substring(11, 16)   : '19:30',
    capacity:      initialData?.capacity ?? 16,
    location:      initialData?.location ?? 'Strindberggasse 1, 1110 Wien',
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
        coach_id: form.coach_id || null,
        starts_at: `${form.date}T${form.startTime}:00`,
        ends_at:   `${form.date}T${form.endTime}:00`,
        capacity: Number(form.capacity),
        location: form.location,
      }
      const result = await upsertSession(data)
      if (result.error) { setError(result.error); return }

      const coachName = coaches.find(c => c.id === form.coach_id)?.name ?? null
      const classTypeName = classTypes.find(ct => ct.id === form.class_type_id)?.name ?? null
      onSuccess({
        id: result.session!.id,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        cancelled: false,
        location: data.location,
        capacity: data.capacity,
        confirmedCount: 0,
        class_types: classTypeName ? { name: classTypeName } : null,
        class_type_id: data.class_type_id,
        coach_id: data.coach_id ?? null,
        coach_name: coachName,
      })
    })
  }

  const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'
  const inputClass = 'w-full border border-border bg-background px-3 py-2 text-sm text-foreground'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Kursart</label>
        <select
          value={form.class_type_id}
          onChange={e => setForm(f => ({ ...f, class_type_id: e.target.value }))}
          className={inputClass}
          required
        >
          {classTypes.map(ct => (
            <option key={ct.id} value={ct.id}>{ct.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Trainer</label>
        <select
          value={form.coach_id}
          onChange={e => setForm(f => ({ ...f, coach_id: e.target.value }))}
          className={inputClass}
        >
          <option value="">— kein Trainer zugewiesen —</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Datum</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Startzeit</label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Endzeit</label>
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Kapazität</label>
        <input
          type="number"
          min={1}
          max={99}
          value={form.capacity}
          onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Ort</label>
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-border px-6 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
