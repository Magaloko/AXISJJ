'use client'

import { useState, useTransition, useEffect } from 'react'
import { upsertCompetition, deleteCompetition, getMyCompetitions, type Competition } from '@/app/actions/competitions'

const PLACEMENTS = ['1st', '2nd', '3rd', 'Top 4', 'DNP', 'Gold', 'Silber', 'Bronze']

export function CompetitionsWidget() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', date: new Date().toISOString().slice(0, 10),
    location: '', category: '', placement: '', notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function refresh() {
    const data = await getMyCompetitions()
    setCompetitions(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  function resetForm() {
    setForm({ name: '', date: new Date().toISOString().slice(0, 10), location: '', category: '', placement: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c: Competition) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      date: c.date,
      location: c.location ?? '',
      category: c.category ?? '',
      placement: c.placement ?? '',
      notes: c.notes ?? '',
    })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await upsertCompetition({
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        date: form.date,
        location: form.location || null,
        category: form.category || null,
        placement: form.placement || null,
        notes: form.notes || null,
      })
      if (result.error) { setError(result.error); return }
      resetForm()
      refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Eintrag löschen?')) return
    startTransition(async () => {
      await deleteCompetition(id)
      refresh()
    })
  }

  const inputCls = 'w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wettkämpfe</p>
          <p className="text-sm font-semibold text-foreground">
            {loading ? '...' : `${competitions.length} Teilnahme${competitions.length !== 1 ? 'n' : ''}`}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            + Neu
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 border border-border bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Turnier *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="z.B. Austrian Open 2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Datum *</label>
              <input required type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ort</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Wien / Prag / ..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kategorie</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Gi Adult Blue -76kg" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Platzierung</label>
              <input list="placements" value={form.placement}
                onChange={e => setForm({ ...form, placement: e.target.value })}
                placeholder="1st / 2nd / DNP" className={inputCls} />
              <datalist id="placements">
                {PLACEMENTS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notizen</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Techniken, Gegner, Learnings..." className={`${inputCls} resize-none`} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {isPending ? '...' : editingId ? 'Aktualisieren' : 'Speichern'}
            </button>
            <button type="button" onClick={resetForm} className="flex-1 border border-border py-2 text-xs font-bold uppercase tracking-wider text-foreground">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {!loading && competitions.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Noch keine Wettkämpfe eingetragen.</p>
      )}

      {competitions.length > 0 && (
        <div className="space-y-2">
          {competitions.map(c => (
            <div key={c.id} className="border border-border bg-background p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(c.date).toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {c.location && ` · ${c.location}`}
                  </p>
                  {c.category && <p className="text-xs text-muted-foreground">{c.category}</p>}
                  {c.notes && <p className="mt-2 text-xs italic text-muted-foreground">{c.notes}</p>}
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  {c.placement && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {c.placement}
                    </span>
                  )}
                  <div className="flex gap-2 text-[10px]">
                    <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-foreground">Bearbeiten</button>
                    <button onClick={() => handleDelete(c.id)} className="text-destructive hover:opacity-70">Löschen</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
