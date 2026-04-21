'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTournament, updateTournament, type Tournament } from '@/app/actions/tournaments'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  initial?: Tournament
  onClose: () => void
  lang: Lang
}

export function TournamentForm({ initial, onClose, lang }: Props) {
  const t = translations[lang].admin.turniere
  const tc = translations[lang].admin.common

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    date: initial?.date ?? '',
    end_date: initial?.end_date ?? '',
    location: initial?.location ?? '',
    type: (initial?.type ?? 'external') as 'internal' | 'external',
    description: initial?.description ?? '',
    registration_deadline: initial?.registration_deadline ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null)
    startTransition(async () => {
      const payload = {
        name: form.name,
        date: form.date,
        end_date: form.end_date || null,
        location: form.location,
        type: form.type,
        description: form.description || null,
        registration_deadline: form.registration_deadline || null,
      }
      const result = initial?.id
        ? await updateTournament(initial.id, payload)
        : await createTournament(payload)
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{initial ? t.formEditHeading : t.formNewHeading}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.name}</label>
          <input className="w-full border border-border bg-background p-2 text-sm"
                 value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.date}</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.endDate}</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.end_date ?? ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.location}</label>
          <input className="w-full border border-border bg-background p-2 text-sm"
                 value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.type}</label>
          <select className="w-full border border-border bg-background p-2 text-sm"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'internal' | 'external' })}>
            <option value="external">{t.typeExternal}</option>
            <option value="internal">{t.typeInternal}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.description}</label>
          <textarea rows={3} className="w-full border border-border bg-background p-2 text-sm"
                    value={form.description ?? ''}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.registrationDeadline}</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm"
                 value={form.registration_deadline ?? ''}
                 onChange={e => setForm({ ...form, registration_deadline: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {tc.save}
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">{tc.cancel}</button>
        </div>
      </div>
    </div>
  )
}
