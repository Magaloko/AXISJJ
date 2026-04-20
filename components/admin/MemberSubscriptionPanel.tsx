'use client'

import { useEffect, useState, useTransition } from 'react'
import { upsertSubscription, deleteSubscription, getSubscriptionsForMember, type Subscription } from '@/app/actions/subscriptions'

interface Props { profileId: string }

const CATEGORY_LABELS = { students: 'Student', adults: 'Erwachsene', kids: 'Kinder' }
const PAYMENT_LABELS = { sepa: 'SEPA', bar: 'Bar', ueberweisung: 'Überweisung', karte: 'Karte' }
const STATUS_LABELS = { active: 'Aktiv', paused: 'Pausiert', cancelled: 'Gekündigt', expired: 'Abgelaufen' }
const STATUS_COLORS = {
  active: 'bg-primary/10 text-primary',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300',
  cancelled: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
}

export function MemberSubscriptionPanel({ profileId }: Props) {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    category: 'students' | 'adults' | 'kids'
    duration_months: number
    price_per_month: number
    start_date: string
    end_date: string
    status: 'active' | 'paused' | 'cancelled' | 'expired'
    payment_method: 'sepa' | 'bar' | 'ueberweisung' | 'karte'
    notes: string
  }>({
    category: 'adults',
    duration_months: 12,
    price_per_month: 80,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'active',
    payment_method: 'sepa',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function refresh() {
    const data = await getSubscriptionsForMember(profileId)
    setSubs(data)
    setLoading(false)
  }
  useEffect(() => { refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profileId])

  function resetForm() {
    setForm({
      category: 'adults', duration_months: 12, price_per_month: 80,
      start_date: new Date().toISOString().slice(0, 10), end_date: '',
      status: 'active', payment_method: 'sepa', notes: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(s: Subscription) {
    setEditingId(s.id)
    setForm({
      category: s.category, duration_months: s.duration_months,
      price_per_month: Number(s.price_per_month),
      start_date: s.start_date, end_date: s.end_date ?? '',
      status: s.status, payment_method: s.payment_method ?? 'sepa',
      notes: s.notes ?? '',
    })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await upsertSubscription({
        ...(editingId ? { id: editingId } : {}),
        profile_id: profileId,
        category: form.category,
        duration_months: form.duration_months,
        price_per_month: form.price_per_month,
        start_date: form.start_date,
        end_date: form.end_date || null,
        status: form.status,
        payment_method: form.payment_method,
        notes: form.notes || null,
      })
      if (result.error) { setError(result.error); return }
      resetForm()
      refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Abo löschen?')) return
    startTransition(async () => {
      await deleteSubscription(id)
      refresh()
    })
  }

  const inputCls = 'w-full border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary'

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Abonnements</p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground"
          >
            + Neu
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2 border border-border bg-background p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Kategorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as 'students' | 'adults' | 'kids' })} className={inputCls}>
                <option value="students">Student</option>
                <option value="adults">Erwachsene</option>
                <option value="kids">Kinder</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Laufzeit (Monate)</label>
              <select value={form.duration_months} onChange={e => setForm({ ...form, duration_months: Number(e.target.value) })} className={inputCls}>
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Preis/Monat (€)</label>
              <input type="number" step="0.01" min={0} value={form.price_per_month}
                onChange={e => setForm({ ...form, price_per_month: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Zahlungsart</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as 'sepa' | 'bar' | 'ueberweisung' | 'karte' })} className={inputCls}>
                <option value="sepa">SEPA</option>
                <option value="bar">Bar</option>
                <option value="ueberweisung">Überweisung</option>
                <option value="karte">Karte</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Start</label>
              <input type="date" required value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Ende (optional)</label>
              <input type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'paused' | 'cancelled' | 'expired' })} className={inputCls}>
                <option value="active">Aktiv</option>
                <option value="paused">Pausiert</option>
                <option value="cancelled">Gekündigt</option>
                <option value="expired">Abgelaufen</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-primary py-1.5 text-xs font-bold text-primary-foreground">
              {editingId ? 'Aktualisieren' : 'Speichern'}
            </button>
            <button type="button" onClick={resetForm} className="flex-1 border border-border py-1.5 text-xs">Abbrechen</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Lade...</p>
      ) : subs.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground">Noch kein Abo hinterlegt.</p>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="border border-border bg-background p-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {CATEGORY_LABELS[s.category]} · {s.duration_months} Mon. · {Number(s.price_per_month).toFixed(0)} €/Mon.
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {new Date(s.start_date).toLocaleDateString('de-AT')}
                    {s.end_date && ` – ${new Date(s.end_date).toLocaleDateString('de-AT')}`}
                    {s.payment_method && ` · ${PAYMENT_LABELS[s.payment_method]}`}
                  </p>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[s.status]}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-[10px]">
                <button onClick={() => startEdit(s)} className="text-muted-foreground hover:text-foreground">Bearbeiten</button>
                <button onClick={() => handleDelete(s.id)} className="text-destructive hover:opacity-70">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
