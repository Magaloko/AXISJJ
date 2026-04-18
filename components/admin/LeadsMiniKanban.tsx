import Link from 'next/link'
import type { LeadsByStatus } from '@/app/actions/admin'

interface Props {
  data: LeadsByStatus
}

export function LeadsMiniKanban({ data }: Props) {
  const columns: Array<{ key: keyof LeadsByStatus['totals']; label: string; accent?: string }> = [
    { key: 'new', label: 'Neu', accent: 'text-primary' },
    { key: 'contacted', label: 'Kontakt.' },
    { key: 'converted', label: 'Konvert.', accent: 'text-[#2e7d32]' },
    { key: 'lost', label: 'Verloren', accent: 'text-destructive' },
  ]

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Leads Pipeline
        </p>
        <Link href="/admin/leads" className="text-xs font-bold text-primary">
          Vollansicht →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {columns.map(col => {
          const items = data[col.key] as { id: string; full_name: string; source: string }[]
          return (
            <div key={col.key}>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wide ${col.accent ?? 'text-muted-foreground'}`}>
                {col.label} · {data.totals[col.key]}
              </p>
              <div className="space-y-1">
                {items.map(lead => (
                  <div key={lead.id} className="border border-border bg-background p-2">
                    <p className="truncate text-xs font-bold text-foreground">{lead.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {lead.source === 'instagram' ? '📸' : '🌐'} {lead.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
