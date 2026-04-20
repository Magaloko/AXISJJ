interface Props {
  estimatedMonthlyRevenue: number
  activeMembers: number
  breakdown: { category: string; members: number; revenue: number }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  students: 'Studenten',
  adults:   'Erwachsene',
  kids:     'Kinder',
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(cents)
}

export function RevenueWidget({ estimatedMonthlyRevenue, activeMembers, breakdown }: Props) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Umsatz-Schätzung</p>
      <p className="mb-5 text-sm font-semibold text-foreground">
        pro Monat · {activeMembers} aktive Mitglieder
      </p>

      <p className="mb-6 font-mono text-4xl font-black text-primary">
        {formatEUR(estimatedMonthlyRevenue)}
      </p>

      <div className="space-y-2 border-t border-border pt-4">
        {breakdown.map(b => (
          <div key={b.category} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {CATEGORY_LABELS[b.category] ?? b.category}
              <span className="ml-2 text-xs">({b.members})</span>
            </span>
            <span className="font-mono font-bold text-foreground">{formatEUR(b.revenue)}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground">
        Basiert auf aktiven Abonnements. Bei {activeMembers} Mitgliedern, davon {breakdown.reduce((sum, b) => sum + b.members, 0)} mit aktivem Abo.
      </p>
    </div>
  )
}
