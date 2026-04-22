'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Send, Tag, Users, Check, X, Clock, Trash2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { deleteDiscountCode } from '@/app/actions/discount-codes'
import type { BroadcastRecord } from '@/app/actions/broadcast'
import type { DiscountCode } from '@/app/actions/discount-codes'

interface Group { id: string; name: string; color: string }

interface Props {
  broadcasts: BroadcastRecord[]
  codes: DiscountCode[]
  groups: Group[]
}

type Tab = 'broadcasts' | 'codes'

const TARGET_LABELS: Record<string, string> = {
  all: 'Alle Mitglieder',
  active: 'Aktive Mitglieder',
  inactive: 'Inaktive Mitglieder',
  leads: 'Leads',
}

export function BroadcastDashboardClient({ broadcasts, codes: initialCodes, groups }: Props) {
  const [tab, setTab] = useState<Tab>('broadcasts')
  const [codes, setCodes] = useState(initialCodes)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function targetLabel(tg: string): string {
    if (TARGET_LABELS[tg]) return TARGET_LABELS[tg]
    if (tg.startsWith('group:')) {
      const g = groups.find(g => `group:${g.id}` === tg)
      return g ? `Gruppe: ${g.name}` : 'Gruppe'
    }
    return tg
  }

  function handleDeleteCode(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteDiscountCode(id)
      setCodes(prev => prev.filter(c => c.id !== id))
      setDeletingId(null)
    })
  }

  // Stats
  const totalEmailSent = broadcasts.reduce((s, b) => s + b.email_sent, 0)
  const totalTelegramSent = broadcasts.reduce((s, b) => s + b.telegram_sent, 0)
  const activeCodesCount = codes.filter(c => {
    if (c.expires_at && new Date(c.expires_at) < new Date()) return false
    if (c.max_uses !== null && c.used_count >= c.max_uses) return false
    return true
  }).length

  return (
    <div>
      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Broadcasts" value={String(broadcasts.length)} />
        <Kpi label="E-Mails gesendet" value={String(totalEmailSent)} />
        <Kpi label="Telegram gesendet" value={String(totalTelegramSent)} />
        <Kpi label="Aktive Codes" value={String(activeCodesCount)} highlight={activeCodesCount > 0} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-border">
        {([
          { key: 'broadcasts', label: 'Gesendet', count: broadcasts.length },
          { key: 'codes', label: 'Rabatt-Codes', count: codes.length },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
              tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            <span className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-black',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Broadcasts list ── */}
      {tab === 'broadcasts' && (
        broadcasts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Send size={36} className="mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Noch keine Nachrichten gesendet.</p>
            <Link href="/admin/broadcast/neu" className="mt-4 text-xs font-bold uppercase tracking-wider text-primary underline">
              Erste Nachricht senden →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border">
            {broadcasts.map(b => (
              <BroadcastRow key={b.id} broadcast={b} targetLabel={targetLabel(b.target_group)} />
            ))}
          </div>
        )
      )}

      {/* ── Discount Codes list ── */}
      {tab === 'codes' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{codes.length} Codes insgesamt</p>
            <Link href="/admin/broadcast/neu" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
              + Neues Angebot mit Codes →
            </Link>
          </div>
          {codes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Rabatt-Codes vorhanden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Code', 'Rabatt', 'Empfänger', 'Gültig bis', 'Verwendet', ''].map(h => (
                      <th key={h} className="py-2 pr-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {codes.map(c => {
                    const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
                    const exhausted = c.max_uses !== null && c.used_count >= c.max_uses
                    const valid = !expired && !exhausted
                    return (
                      <tr key={c.id} className={cn(!valid && 'opacity-50')}>
                        <td className="py-2.5 pr-4 font-mono text-xs font-bold text-foreground">{c.code}</td>
                        <td className="py-2.5 pr-4 text-foreground">
                          {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value}€`}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                          {c.recipient_email ?? '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                          {c.expires_at
                            ? new Date(c.expires_at).toLocaleDateString('de-AT')
                            : '∞'}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">
                          <span className={c.used_count > 0 ? 'font-bold text-primary' : 'text-muted-foreground'}>
                            {c.used_count}/{c.max_uses ?? '∞'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => handleDeleteCode(c.id)}
                            disabled={deletingId === c.id || isPending}
                            className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-black', highlight ? 'text-primary' : 'text-foreground')}>{value}</p>
    </div>
  )
}

function BroadcastRow({ broadcast: b, targetLabel }: { broadcast: BroadcastRecord; targetLabel: string }) {
  const channelIcons = b.channels.map(c => c === 'email' ? '✉' : '✈').join(' ')
  const totalSent = b.email_sent + b.telegram_sent
  const isOffer = b.message_type === 'offer'

  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
              b.status === 'sent' ? 'bg-green-500/10 text-green-600' :
              b.status === 'sending' ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-muted text-muted-foreground'
            )}>
              {b.status}
            </span>
            {isOffer && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5">
                {b.offer_discount_pct}% Angebot
              </span>
            )}
          </div>
          <p className="mt-1 font-bold text-foreground">{b.subject}</p>
          <p className="text-xs text-muted-foreground">{b.title}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{new Date(b.created_at).toLocaleDateString('de-AT')}</p>
          <p>{channelIcons} {b.recipient_count} Empfänger</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Zielgruppe: <strong className="text-foreground">{targetLabel}</strong></span>
        {b.email_sent > 0 && <span>✉ {b.email_sent} gesendet{b.email_failed > 0 ? ` / ${b.email_failed} fehlgeschlagen` : ''}</span>}
        {b.telegram_sent > 0 && <span>✈ {b.telegram_sent} Telegram</span>}
      </div>
    </div>
  )
}
