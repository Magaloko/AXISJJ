import { getGymSettings } from '@/lib/gym-settings'
import { ContactCard } from '@/components/public/ContactCard'
import { OpeningHoursDisplay } from '@/components/public/OpeningHoursDisplay'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kontakt | AXIS Jiu-Jitsu' }

export default async function KontaktPage() {
  const settings = await getGymSettings()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-black text-foreground">Kontakt</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <ContactCard settings={settings} />
        </div>
        <div className="border border-border bg-card p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Öffnungszeiten</p>
          <OpeningHoursDisplay hours={settings.opening_hours} variant="full" />
        </div>
      </div>
    </div>
  )
}
