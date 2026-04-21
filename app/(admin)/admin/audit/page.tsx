import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Pencil, UserCog, Plus, FileEdit, XCircle, Award,
  Tag, Trash2, Settings, Clock, ScrollText, FileText,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit-Log | Admin' }

const ACTION_ICONS: Record<string, LucideIcon> = {
  'member.updated':       Pencil,
  'member.role_changed':  UserCog,
  'session.created':      Plus,
  'session.updated':      FileEdit,
  'session.cancelled':    XCircle,
  'belt.promoted':        Award,
  'classtype.upserted':   Tag,
  'classtype.deleted':    Trash2,
  'gym.info_updated':     Settings,
  'gym.hours_updated':    Clock,
  'gym.policies_updated': ScrollText,
}

const ACTION_LABELS: Record<string, string> = {
  'member.updated':      'Mitglied aktualisiert',
  'member.role_changed': 'Rolle geändert',
  'session.created':     'Session erstellt',
  'session.updated':     'Session aktualisiert',
  'session.cancelled':   'Session abgesagt',
  'belt.promoted':       'Gurt-Beförderung',
  'classtype.upserted':  'Kursart geändert',
  'classtype.deleted':   'Kursart gelöscht',
  'gym.info_updated':    'Gym-Info aktualisiert',
  'gym.hours_updated':   'Öffnungszeiten',
  'gym.policies_updated':'Richtlinien',
}

function formatMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null
  const entries = Object.entries(meta as Record<string, unknown>)
  if (entries.length === 0) return null
  return entries
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: ${v.join(', ')}`
      if (typeof v === 'object' && v !== null) return `${k}: ${JSON.stringify(v)}`
      return `${k}: ${String(v)}`
    })
    .join(' · ')
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const { data: entries } = await supabase
    .from('audit_log')
    .select('id, actor_id, actor_name, action, target_type, target_id, target_name, meta, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-black text-foreground">Audit-Log</h1>
        <p className="text-xs text-muted-foreground">{entries?.length ?? 0} Einträge (neueste 200)</p>
      </div>

      <div className="border border-border bg-card">
        {!entries || entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Noch keine protokollierten Aktionen.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Aktion</th>
                <th className="p-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Ziel</th>
                <th className="p-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Akteur</th>
                <th className="p-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">Zeit</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const metaStr = formatMeta(e.meta)
                const Icon = ACTION_ICONS[e.action] ?? FileText
                return (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0 text-muted-foreground" strokeWidth={2} />
                        <span className="font-semibold text-foreground">
                          {ACTION_LABELS[e.action] ?? e.action}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-foreground">{e.target_name ?? '—'}</p>
                      {metaStr && <p className="mt-0.5 text-xs text-muted-foreground">{metaStr}</p>}
                    </td>
                    <td className="p-3 text-muted-foreground">{e.actor_name ?? '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(e.created_at), { addSuffix: true, locale: de })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
