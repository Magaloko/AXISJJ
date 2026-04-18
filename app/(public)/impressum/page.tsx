import { getGymSettings } from '@/lib/gym-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Impressum | AXIS Jiu-Jitsu' }

export default async function ImpressumPage() {
  const settings = await getGymSettings()
  const { name, address_line1, address_line2, postal_code, city, country, phone, email, website,
    house_rules, cancellation_policy, pricing_info } = settings

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-black text-foreground">Impressum</h1>

      <section className="mb-8 border border-border bg-card p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Angaben gemäß § 5 ECG</p>
        <p className="text-lg font-black">{name}</p>
        {address_line1 && <p className="text-sm">{address_line1}</p>}
        {address_line2 && <p className="text-sm">{address_line2}</p>}
        {(postal_code || city) && <p className="text-sm">{[postal_code, city].filter(Boolean).join(' ')}</p>}
        {country && <p className="text-sm">{country}</p>}
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {phone && <p>Telefon: {phone}</p>}
          {email && <p>E-Mail: {email}</p>}
          {website && <p>Website: {website}</p>}
        </div>
      </section>

      {[
        { title: 'Haus-Regeln', body: house_rules },
        { title: 'Kündigungsfristen', body: cancellation_policy },
        { title: 'Preise', body: pricing_info },
      ].map(section => (
        <details key={section.title} open className="mb-3 border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{section.title}</summary>
          <div className="whitespace-pre-line px-4 pb-4 text-sm text-muted-foreground">
            {section.body || '— Noch nicht gepflegt —'}
          </div>
        </details>
      ))}
    </div>
  )
}
