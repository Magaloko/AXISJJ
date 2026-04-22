import { EmptyStateCard } from '@/components/ui/empty-state-card'
import type { TrainingPartner } from '@/app/actions/training-partners'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  partners: TrainingPartner[]
  lang: Lang
}

export function TrainingPartnersWidget({ partners, lang }: Props) {
  const t = translations[lang].dashboard

  if (partners.length === 0) {
    return (
      <EmptyStateCard
        label={t.trainingPartnersLabel}
        description={t.trainingPartnersEmpty}
      />
    )
  }

  const firstPartner = partners[0]

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.trainingPartnersLabel}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {firstPartner.beltColor && (
              <span
                className="inline-block h-3 w-10 rounded-sm"
                style={{
                  backgroundColor: firstPartner.beltColor,
                  border:
                    firstPartner.beltColor === '#111111'
                      ? '1px solid oklch(58% 0.21 28)'
                      : undefined,
                }}
              />
            )}
            <span className="text-sm font-bold text-foreground">
              {firstPartner.beltName}
              {firstPartner.stripes > 0 && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  {'|'.repeat(firstPartner.stripes)}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{t.trainingPartnersSubtitle}</p>

      <div className="space-y-1">
        {partners.map((p) => (
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
