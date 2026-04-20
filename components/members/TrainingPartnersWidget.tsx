'use client'

import { useEffect, useState } from 'react'
import { getTrainingPartners, type TrainingPartner } from '@/app/actions/training-partners'

export function TrainingPartnersWidget() {
  const [partners, setPartners] = useState<TrainingPartner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrainingPartners().then(data => {
      setPartners(data)
      setLoading(false)
    })
  }, [])

  if (loading) return null
  if (partners.length === 0) return null

  const firstPartner = partners[0]

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Dein Trainings-Level
          </p>
          <div className="mt-1 flex items-center gap-2">
            {firstPartner.beltColor && (
              <span
                className="inline-block h-3 w-10 rounded-sm"
                style={{ backgroundColor: firstPartner.beltColor, border: firstPartner.beltColor === '#111111' ? '1px solid oklch(58% 0.21 28)' : undefined }}
              />
            )}
            <span className="text-sm font-bold text-foreground">
              {firstPartner.beltName}
              {firstPartner.stripes > 0 && <span className="ml-1 font-mono text-xs text-muted-foreground">{'|'.repeat(firstPartner.stripes)}</span>}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Mitglieder mit deinem Gürtel, sortiert nach Aktivität (letzte 30 Tage):
      </p>

      <div className="space-y-1">
        {partners.map(p => (
          <div
            key={p.profileId}
            className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm last:border-b-0"
          >
            <span className="font-semibold text-foreground">{p.fullName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {p.attendancesLast30d}× / 30d
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
