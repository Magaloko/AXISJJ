import type { GymSettings } from '@/lib/gym-settings'

interface Props { settings: GymSettings }

export function PoliciesSection({ settings }: Props) {
  const sections = [
    { title: 'Haus-Regeln', body: settings.house_rules },
    { title: 'Kündigungsfristen', body: settings.cancellation_policy },
    { title: 'Preise', body: settings.pricing_info },
  ]

  if (sections.every(s => !s.body)) return null

  return (
    <div className="mt-8 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gym-Informationen</p>
      {sections.map(section => (
        <details key={section.title} className="border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{section.title}</summary>
          <div className="whitespace-pre-line px-4 pb-4 text-sm text-muted-foreground">
            {section.body || '— Noch nicht verfügbar —'}
          </div>
        </details>
      ))}
    </div>
  )
}
