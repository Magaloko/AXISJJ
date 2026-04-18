interface HistoryRow {
  promotedAt: string
  memberName: string
  fromBelt: string | null
  fromBeltColor: string | null
  toBelt: string
  toBeltColor: string | null
  promotedByName: string | null
}

interface Props { rows: HistoryRow[] }

export function PromotionHistory({ rows }: Props) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Promotions-History
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Promotions.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r, i) => (
            <li key={i} className="py-2">
              <p className="text-sm font-bold text-foreground">{r.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {r.fromBelt ? (
                  <>
                    <span style={{ color: r.fromBeltColor ?? undefined }}>{r.fromBelt}</span>
                    {' → '}
                  </>
                ) : '— → '}
                <span style={{ color: r.toBeltColor ?? undefined }} className="font-bold">{r.toBelt}</span>
                <span className="ml-2 font-mono text-muted-foreground">{formatDate(r.promotedAt)}</span>
                {r.promotedByName && <span className="ml-2 text-muted-foreground">· {r.promotedByName}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
