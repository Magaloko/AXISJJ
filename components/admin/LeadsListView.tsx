'use client'

import { useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'
import type { Lead } from './LeadsKanban'

interface Props { leads: Lead[] }

export function LeadsListView({ leads }: Props) {
  const [isPending, startTransition] = useTransition()

  function onChange(leadId: string, status: Lead['status']) {
    startTransition(async () => { await updateLeadStatus(leadId, status) })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">E-Mail</th>
            <th className="p-3">Quelle</th>
            <th className="p-3">Status</th>
            <th className="p-3">Datum</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id} className="border-b border-border">
              <td className="p-3 font-bold">{l.full_name}</td>
              <td className="p-3 text-muted-foreground">{l.email}</td>
              <td className="p-3">{l.source === 'instagram' ? '📸 Instagram' : '🌐 Website'}</td>
              <td className="p-3">
                <select value={l.status}
                        disabled={isPending}
                        onChange={e => onChange(l.id, e.target.value as Lead['status'])}
                        className="border border-border bg-background p-1 text-xs">
                  <option value="new">Neu</option>
                  <option value="contacted">Kontaktiert</option>
                  <option value="converted">Konvertiert</option>
                  <option value="lost">Verloren</option>
                </select>
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{formatDate(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
