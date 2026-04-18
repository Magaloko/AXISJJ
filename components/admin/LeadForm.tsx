'use client'

import { useState, useTransition } from 'react'
import { createLead } from '@/app/actions/leads'

interface Props { onClose: () => void; onCreated: () => void }

export function LeadForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '', source: 'website' as 'website' | 'instagram' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await createLead({
        full_name: form.full_name, email: form.email,
        phone: form.phone || undefined, message: form.message || undefined,
        source: form.source,
      })
      if (result.error) { setError(result.error); return }
      onCreated()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">Neuer Lead</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Name"
               value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="E-Mail" type="email"
               value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder="Telefon (optional)"
               value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <textarea className="w-full border border-border bg-background p-2 text-sm" placeholder="Nachricht (optional)" rows={3}
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <select className="w-full border border-border bg-background p-2 text-sm"
                value={form.source} onChange={e => setForm({ ...form, source: e.target.value as 'website' | 'instagram' })}>
          <option value="website">Website</option>
          <option value="instagram">Instagram</option>
        </select>
        <div className="flex gap-2">
          <button onClick={submit} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            Erstellen
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
        </div>
      </div>
    </div>
  )
}
