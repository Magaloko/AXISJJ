'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Send, Tag, Users, Image, Percent, Clock, CheckSquare, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { sendBroadcast } from '@/app/actions/broadcast'

type Channel = 'email' | 'telegram'
type MessageType = 'text' | 'offer'
type TargetGroup = 'all' | 'active' | 'inactive' | 'leads' | string

interface Group { id: string; name: string; color: string }
interface Props { groups: Group[] }

const TARGET_OPTIONS = [
  { value: 'all',      label: 'Alle Mitglieder',               desc: 'Alle registrierten Members' },
  { value: 'active',   label: 'Aktive Mitglieder',             desc: 'Waren in den letzten 30 Tagen im Training' },
  { value: 'inactive', label: 'Inaktive Mitglieder',           desc: 'Länger als 30 Tage nicht da — Re-Engagement' },
  { value: 'leads',    label: 'Leads (Probetraining)',         desc: 'Interessenten, noch kein Abo' },
]

const inputClass = 'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'
const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground'

export function BroadcastForm({ groups }: Props) {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['email'])
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('all')
  const [messageType, setMessageType] = useState<MessageType>('text')
  const [discountPct, setDiscountPct] = useState(20)
  const [expiresDays, setExpiresDays] = useState(14)

  // UI state
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  function toggleChannel(ch: Channel) {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  const targetLabel = TARGET_OPTIONS.find(o => o.value === targetGroup)?.label
    ?? groups.find(g => `group:${g.id}` === targetGroup)?.name
    ?? 'Zielgruppe'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!channels.length) { setError('Mindestens einen Kanal auswählen.'); return }
    setError('')
    setSending(true)

    const res = await sendBroadcast({
      title,
      subject,
      body,
      image_url: imageUrl || null,
      channels,
      target_group: targetGroup,
      message_type: messageType,
      offer_discount_pct: messageType === 'offer' ? discountPct : null,
      offer_expires_days: messageType === 'offer' ? expiresDays : null,
    })

    setSending(false)
    if ('error' in res && res.error) { setError(res.error); return }

    router.push('/admin/broadcast')
  }

  const charCount = body.length

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* ── Left: Message content ── */}
      <div className="space-y-5">
        {/* Internal title */}
        <div>
          <label className={labelClass}>Interner Titel *</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="z.B. Gi-Anzüge Aktion Oktober"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">Nur für interne Übersicht, wird nicht gesendet.</p>
        </div>

        {/* Message type toggle */}
        <div>
          <label className={labelClass}>Nachrichtentyp</label>
          <div className="flex gap-0">
            {([
              { key: 'text',  label: 'Text-Nachricht',   icon: Mail },
              { key: 'offer', label: 'Angebot + Rabatt', icon: Tag },
            ] as { key: MessageType; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMessageType(key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 border py-3 text-xs font-bold uppercase tracking-wider transition-colors',
                  messageType === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className={labelClass}>Betreff / Titel *</label>
          <input
            value={subject} onChange={e => setSubject(e.target.value)} required
            placeholder="z.B. Neue Gi-Anzüge jetzt verfügbar!"
            className={inputClass}
          />
        </div>

        {/* Body */}
        <div>
          <label className={labelClass}>Nachricht *</label>
          <textarea
            value={body} onChange={e => setBody(e.target.value)} required
            rows={8}
            placeholder="Schreibe deine Nachricht hier…

Neuer Absatz = Leerzeile. Markdown-Formatierung wird in Telegram unterstützt (*fett*, _kursiv_)."
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{charCount} Zeichen</p>
        </div>

        {/* Image URL */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1"><Image size={11} /> Bild-URL (optional)</span>
          </label>
          <input
            value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…/bild.jpg"
            type="url"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Bild wird in der E-Mail angezeigt. Tipp: Bild erst in Supabase Storage hochladen, dann URL einfügen.
          </p>
        </div>

        {/* Offer settings */}
        {messageType === 'offer' && (
          <div className="border border-primary/30 bg-primary/5 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Angebot-Einstellungen</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1"><Percent size={11} /> Rabatt (%)</span>
                </label>
                <input
                  type="number" min={1} max={100} value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1"><Clock size={11} /> Gültig (Tage)</span>
                </label>
                <input
                  type="number" min={1} max={365} value={expiresDays}
                  onChange={e => setExpiresDays(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="border border-border bg-card p-3">
              <p className="text-xs font-bold text-foreground">Was passiert:</p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                <li>• Jeder Empfänger bekommt einen <strong>persönlichen Code</strong> (z.B. AXIS-K7X3P2)</li>
                <li>• Code gibt <strong>{discountPct}% Rabatt</strong> beim Ausfüllen des Anmeldeformulars</li>
                <li>• Codes laufen nach <strong>{expiresDays} Tagen</strong> ab</li>
                <li>• Alle Codes im Broadcast-Center einsehbar</li>
              </ul>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* ── Right: Settings sidebar ── */}
      <div className="space-y-5">
        {/* Channels */}
        <div className="border border-border bg-card p-4">
          <p className={labelClass}>Kanal auswählen *</p>
          <div className="space-y-2">
            {([
              { key: 'email',    label: 'E-Mail',   desc: 'An alle mit E-Mail-Adresse' },
              { key: 'telegram', label: 'Telegram', desc: 'An alle, die den Bot verknüpft haben' },
            ] as { key: Channel; label: string; desc: string }[]).map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleChannel(key)}
                className={cn(
                  'flex w-full items-start gap-3 border p-3 text-left transition-colors',
                  channels.includes(key) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border',
                  channels.includes(key) ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {channels.includes(key) && <CheckSquare size={10} className="text-primary-foreground" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Target group */}
        <div className="border border-border bg-card p-4">
          <p className={labelClass}>Zielgruppe *</p>
          <div className="space-y-1">
            {TARGET_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTargetGroup(o.value as TargetGroup)}
                className={cn(
                  'flex w-full items-start gap-3 p-2.5 text-left transition-colors rounded',
                  targetGroup === o.value ? 'bg-primary/10' : 'hover:bg-muted'
                )}
              >
                <div className={cn(
                  'mt-0.5 h-3 w-3 shrink-0 rounded-full border',
                  targetGroup === o.value ? 'border-primary bg-primary' : 'border-border'
                )} />
                <div>
                  <p className={cn('text-xs font-bold', targetGroup === o.value ? 'text-primary' : 'text-foreground')}>
                    {o.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{o.desc}</p>
                </div>
              </button>
            ))}

            {/* Training groups */}
            {groups.length > 0 && (
              <>
                <p className="mt-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Training-Gruppen</p>
                {groups.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setTargetGroup(`group:${g.id}`)}
                    className={cn(
                      'flex w-full items-center gap-3 p-2.5 text-left transition-colors rounded',
                      targetGroup === `group:${g.id}` ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                    <p className={cn('text-xs font-bold', targetGroup === `group:${g.id}` ? 'text-primary' : 'text-foreground')}>
                      {g.name}
                    </p>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Summary box */}
        <div className="border border-border bg-card p-4 space-y-2 text-xs">
          <p className="font-bold uppercase tracking-wider text-foreground">Zusammenfassung</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Kanal: <span className="font-bold text-foreground">{channels.join(' + ') || '—'}</span></p>
            <p>Zielgruppe: <span className="font-bold text-foreground">{targetLabel}</span></p>
            <p>Typ: <span className="font-bold text-foreground">
              {messageType === 'offer' ? `Angebot (${discountPct}%, ${expiresDays}d)` : 'Text-Nachricht'}
            </span></p>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending || !channels.length || !title || !subject || !body}
          className="flex w-full items-center justify-center gap-2 bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {sending
            ? <span className="animate-pulse">Wird gesendet…</span>
            : <><Send size={14} /> Jetzt senden</>
          }
        </button>

        <p className="text-center text-[10px] text-muted-foreground">
          Nachrichten werden sofort gesendet und können nicht zurückgerufen werden.
        </p>
      </div>
    </form>
  )
}
