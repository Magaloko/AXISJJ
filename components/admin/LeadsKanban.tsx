'use client'

import { useState, useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'

type Status = 'new' | 'contacted' | 'converted' | 'lost'
export interface Lead {
  id: string
  full_name: string
  email: string
  source: 'website' | 'instagram'
  status: Status
  created_at: string
}

interface Props { initialLeads: Lead[] }

export function LeadsKanban({ initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [isPending, startTransition] = useTransition()

  function move(leadId: string, newStatus: Status) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    startTransition(async () => {
      await updateLeadStatus(leadId, newStatus)
    })
  }

  function renderActions(l: Lead) {
    const btn = (label: string, next: Status, variant: 'primary' | 'muted' | 'danger' = 'muted') => (
      <button key={next}
              onClick={() => move(l.id, next)} disabled={isPending}
              className={`px-2 py-1 text-[10px] font-bold disabled:opacity-50 ${
                variant === 'primary' ? 'bg-primary text-primary-foreground'
                : variant === 'danger' ? 'border border-destructive text-destructive'
                : 'border border-border'
              }`}>{label}</button>
    )
    if (l.status === 'new') return [btn('Kontaktiert →', 'contacted'), btn('Verloren', 'lost', 'danger')]
    if (l.status === 'contacted') return [btn('Konvertiert →', 'converted', 'primary'), btn('Verloren', 'lost', 'danger')]
    if (l.status === 'lost') return [btn('Wiederaufnehmen → Neu', 'new')]
    return []
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  }

  const columns: Array<{ key: Status; label: string; bg: string }> = [
    { key: 'new', label: 'Neu', bg: 'bg-muted/40' },
    { key: 'contacted', label: 'Kontaktiert', bg: 'bg-muted/40' },
    { key: 'converted', label: 'Konvertiert', bg: 'bg-[#e8f5e9]' },
    { key: 'lost', label: 'Verloren', bg: 'bg-[#fdf5f5]' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map(col => {
        const items = leads.filter(l => l.status === col.key)
        return (
          <div key={col.key} className={`${col.bg} p-3`}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {col.label} · {items.length}
            </p>
            <div className="space-y-2">
              {items.map(l => (
                <div key={l.id} className="border border-border bg-card p-3">
                  <p className="text-sm font-bold">{l.full_name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {l.source === 'instagram' ? '📸' : '🌐'} {l.source} · {formatDate(l.created_at)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{l.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{renderActions(l)}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
