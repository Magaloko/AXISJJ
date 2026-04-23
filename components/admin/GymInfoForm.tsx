'use client'

import { useState, useTransition } from 'react'
import { updateGymInfo } from '@/app/actions/gym-settings'
import { useRouter } from 'next/navigation'
import type { GymSettings } from '@/lib/gym-settings'
import { translations, type Lang } from '@/lib/i18n'

interface Props { initial: GymSettings; lang: Lang }

export function GymInfoForm({ initial, lang }: Props) {
  const tg = translations[lang].admin.gym
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
    public_transport: (initial as unknown as { public_transport?: string | null }).public_transport ?? '',
    parking_info:     (initial as unknown as { parking_info?: string | null }).parking_info ?? '',
    map_embed_url:    (initial as unknown as { map_embed_url?: string | null }).map_embed_url ?? '',
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
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{tg.info}</p>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mb-2 text-xs text-[#2e7d32]">{tg.saved}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>{tg.name} *</label>
          <input className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{tg.address}</label>
          <input className={input} value={form.address_line1}
                 onChange={e => setForm({ ...form, address_line1: e.target.value })} placeholder={tg.addressPlaceholder} />
        </div>
        <div className="sm:col-span-2">
          <input className={input} value={form.address_line2}
                 onChange={e => setForm({ ...form, address_line2: e.target.value })} placeholder={tg.addressLine2Placeholder} />
        </div>
        <div>
          <label className={label}>{tg.postalCode}</label>
          <input className={input} value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
        </div>
        <div>
          <label className={label}>{tg.city}</label>
          <input className={input} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{tg.country}</label>
          <input className={input} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
        <div>
          <label className={label}>{tg.phone}</label>
          <input className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={label}>{tg.email}</label>
          <input className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{tg.website}</label>
          <input className={input} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>

        <div className="sm:col-span-2 mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Anfahrt</p>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Öffentliche Verbindung</label>
          <textarea
            className={input + ' min-h-[60px] resize-y'}
            value={form.public_transport}
            onChange={e => setForm({ ...form, public_transport: e.target.value })}
            placeholder="z.B. U6 Erlaaer Straße oder Perfektastraße, Bus 61A vor der Haustür"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Auto / Parken</label>
          <textarea
            className={input + ' min-h-[60px] resize-y'}
            value={form.parking_info}
            onChange={e => setForm({ ...form, parking_info: e.target.value })}
            placeholder="z.B. 15 Parkplätze für Mitglieder. Parkhaus Perfektastraße 4,10€/Tag"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Google Maps Embed URL (optional)</label>
          <input
            className={input}
            value={form.map_embed_url}
            onChange={e => setForm({ ...form, map_embed_url: e.target.value })}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Leer lassen → nutzt automatisch die Adresse oben. Für genaue Position: Google Maps → Teilen → Karte einbetten → Nur die URL im src kopieren.
          </p>
        </div>
      </div>
      <button onClick={save} disabled={isPending}
              className="mt-4 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
        {tg.save}
      </button>
    </div>
  )
}
