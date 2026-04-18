'use client'

import { useState, useTransition } from 'react'
import { updateGymInfo } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import type { GymSettings } from '@/lib/gym-settings'

interface Props { initial: GymSettings }

export function GymInfoForm({ initial }: Props) {
  const [form, setForm] = useState({
    name: initial.name,
    address_line1: initial.address_line1 ?? '',
    address_line2: initial.address_line2 ?? '',
    postal_code: initial.postal_code ?? '',
    city: initial.city ?? '',
    country: initial.country ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    website: initial.website ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await updateGymInfo(form)
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      router.refresh()
    })
  }

  const input = 'w-full border border-border bg-background p-2 text-sm'
  const label = 'mb-1 block text-xs text-muted-foreground'

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Gym-Info</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">Gespeichert.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Name *</label>
          <input className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Adresse</label>
          <input className={input} value={form.address_line1}
                 onChange={e => setForm({ ...form, address_line1: e.target.value })} placeholder="Straße und Nummer" />
        </div>
        <div className="sm:col-span-2">
          <input className={input} value={form.address_line2}
                 onChange={e => setForm({ ...form, address_line2: e.target.value })} placeholder="Top / Stiege (optional)" />
        </div>
        <div>
          <label className={label}>PLZ</label>
          <input className={input} value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ort</label>
          <input className={input} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Land</label>
          <input className={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
        <div>
          <label className={label}>Telefon</label>
          <input className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={label}>E-Mail</label>
          <input className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Website</label>
          <input className={input} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
      </div>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        Speichern
      </button>
    </div>
  )
}
