// components/admin/SessionForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertSession, createRecurringSessions, type SessionFormData } from '@/app/actions/sessions'
import type { Session, Coach } from './SessionCalendar'

interface ClassType { id: string; name: string }

interface Props {
  initialData?: Partial<SessionFormData & { coach_id?: string | null }>
  classTypes: ClassType[]
  coaches: Coach[]
  onSuccess: (session: Session) => void
  onCancel: () => void
  /** When editing an existing session, recurrence is hidden */
  isEdit?: boolean
}

const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Montag',     short: 'MO' },
  { value: 2, label: 'Dienstag',   short: 'DI' },
  { value: 3, label: 'Mittwoch',   short: 'MI' },
  { value: 4, label: 'Donnerstag', short: 'DO' },
  { value: 5, label: 'Freitag',    short: 'FR' },
  { value: 6, label: 'Samstag',    short: 'SA' },
  { value: 0, label: 'Sonntag',    short: 'SO' },
]

function addMonthsStr(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

export function SessionForm({ initialData, classTypes, coaches, onSuccess, onCancel, isEdit = false }: Props) {
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
  const [recurrence, setRecurrence] = useState<'once' | 'weekly'>('once')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [endDate, setEndDate] = useState<string>(() => addMonthsStr(today, 3))

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleWeekday(v: number) {
    setWeekdays(prev => prev.includes(v) ? prev.filter(w => w !== v) : [...prev, v])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.startTime >= form.endTime) {
      setError('Endzeit muss nach der Startzeit liegen.')
      return
    }

    startTransition(async () => {
      if (recurrence === 'weekly' && !form.id) {
        if (weekdays.length === 0) { setError('Mindestens einen Wochentag auswählen.'); return }
        const result = await createRecurringSessions({
          class_type_id: form.class_type_id,
          coach_id:      form.coach_id || null,
          start_date:    form.date,
          end_date:      endDate,
          start_time:    form.startTime,
          end_time:      form.endTime,
          weekdays,
          capacity:      Number(form.capacity),
          location:      form.location,
        })
        if (result.error) { setError(result.error); return }

        // Full-page reload to show new sessions — recurring bulk-insert doesn't give us all IDs cleanly
        window.location.reload()
        return
      }

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

      {/* Recurrence toggle (only for new sessions) */}
      {!isEdit && !form.id && (
        <div className="border border-border bg-muted/30 p-3">
          <label className={labelClass}>Wiederholung</label>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setRecurrence('once')}
              className={`flex-1 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                recurrence === 'once'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              Einmalig
            </button>
            <button
              type="button"
              onClick={() => setRecurrence('weekly')}
              className={`flex-1 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                recurrence === 'weekly'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              Wöchentlich
            </button>
          </div>

          {recurrence === 'weekly' && (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Wochentage
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map(w => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => toggleWeekday(w.value)}
                      className={`h-9 w-11 border text-xs font-bold transition-colors ${
                        weekdays.includes(w.value)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                      title={w.label}
                    >
                      {w.short}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Bis einschließlich
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={form.date}
                  onChange={e => setEndDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Erstellt pro Wochentag eine Session zwischen Start- und Enddatum.
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>
          {recurrence === 'weekly' && !form.id ? 'Startdatum' : 'Datum'}
        </label>
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
          {isPending ? 'Speichern...' : recurrence === 'weekly' && !form.id ? 'Alle erstellen' : 'Speichern'}
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
