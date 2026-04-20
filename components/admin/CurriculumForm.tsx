'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCurriculum } from '@/app/actions/curriculum'

export function CurriculumForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [ageGroup, setAgeGroup] = useState<'adults' | 'kids'>('adults')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createCurriculum({
        name: name.trim(),
        description: description.trim() || undefined,
        duration_weeks: durationWeeks,
        age_group: ageGroup,
      })
      if (result.error) {
        setError(result.error)
      } else if (result.id) {
        router.push(`/admin/curriculum/${result.id}`)
      }
    })
  }

  const inputCls = 'w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelCls}>Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          placeholder="z.B. Month 1: Foundations"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Beschreibung</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Worum geht es? (optional)"
          className={`${inputCls} resize-y`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="duration" className={labelCls}>Dauer (Wochen)</label>
          <input
            id="duration"
            type="number"
            min={1}
            max={52}
            value={durationWeeks}
            onChange={e => setDurationWeeks(Number(e.target.value))}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="age" className={labelCls}>Zielgruppe</label>
          <select
            id="age"
            value={ageGroup}
            onChange={e => setAgeGroup(e.target.value as 'adults' | 'kids')}
            className={inputCls}
          >
            <option value="adults">Erwachsene</option>
            <option value="kids">Kinder</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending || name.trim().length < 2}
        className="bg-primary px-6 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Anlegen…' : 'Anlegen'}
      </button>
    </form>
  )
}
