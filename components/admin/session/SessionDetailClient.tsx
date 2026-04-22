'use client'

import { useState, useTransition } from 'react'
import { Star, Users, Swords, ChevronDown, Check, X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { upsertSessionRating } from '@/app/actions/session-ratings'
import {
  addSparringPairing, deleteSparringPairing, updateSparringOutcome, setSessionSparring
} from '@/app/actions/sparring'
import type { SessionRating } from '@/app/actions/session-ratings'
import type { SparringPairing } from '@/app/actions/sparring'

interface SessionData {
  id: string
  starts_at: string
  cancelled: boolean
  capacity: number | null
  coach_name: string | null
  class_type_name: string | null
  class_type_gi: boolean
  class_type_level: string | null
  is_sparring: boolean
}

interface Attendee {
  id: string
  profile_id: string
  full_name: string | null
  checked_in_at: string
}

interface Member {
  id: string
  full_name: string | null
}

interface Props {
  session: SessionData
  attendees: Attendee[]
  allMembers: Member[]
  ratings: SessionRating[]
  pairings: SparringPairing[]
}

type Tab = 'attendees' | 'ratings' | 'sparring'

const OUTCOME_LABELS: Record<string, string> = {
  a_wins: 'A gewinnt',
  b_wins: 'B gewinnt',
  draw: 'Unentschieden',
}

export function SessionDetailClient({ session, attendees, allMembers, ratings: initialRatings, pairings: initialPairings }: Props) {
  const [tab, setTab] = useState<Tab>('attendees')
  const [isSparring, setIsSparring] = useState(session.is_sparring)
  const [ratings, setRatings] = useState(initialRatings)
  const [pairings, setPairings] = useState(initialPairings)
  const [isPending, startTransition] = useTransition()

  // ── Sparring toggle ──
  function handleSparringToggle() {
    const next = !isSparring
    setIsSparring(next)
    startTransition(async () => {
      const res = await setSessionSparring(session.id, next)
      if ('error' in res) setIsSparring(!next)
    })
  }

  // ── Ratings summary ──
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null

  return (
    <div>
      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Anwesend</p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {attendees.length}{session.capacity ? `/${session.capacity}` : ''}
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bewertung Ø</p>
          <p className="mt-1 text-2xl font-black text-foreground">{avgRating ?? '—'}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sparring</p>
          <button
            onClick={handleSparringToggle}
            disabled={isPending}
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider',
              isSparring ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isSparring ? <Check size={14} /> : <X size={14} />}
            {isSparring ? 'Ja' : 'Nein'}
          </button>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paarungen</p>
          <p className="mt-1 text-2xl font-black text-foreground">{pairings.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-border">
        {([
          { key: 'attendees', label: 'Anwesenheit', Icon: Users },
          { key: 'ratings', label: 'Bewertungen', Icon: Star },
          { key: 'sparring', label: 'Sparring', Icon: Swords },
        ] as { key: Tab; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors',
              tab === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Attendees */}
      {tab === 'attendees' && (
        <AttendeeList attendees={attendees} />
      )}

      {/* Tab: Ratings */}
      {tab === 'ratings' && (
        <RatingsPanel
          sessionId={session.id}
          ratings={ratings}
          onRatingAdded={r => setRatings(prev => {
            const idx = prev.findIndex(x => x.profile_id === r.profile_id)
            return idx >= 0 ? prev.map((x, i) => i === idx ? r : x) : [...prev, r]
          })}
        />
      )}

      {/* Tab: Sparring */}
      {tab === 'sparring' && (
        <SparringPanel
          sessionId={session.id}
          pairings={pairings}
          allMembers={allMembers}
          attendees={attendees}
          onPairingAdded={p => setPairings(prev => [...prev, p])}
          onPairingDeleted={id => setPairings(prev => prev.filter(p => p.id !== id))}
          onOutcomeChanged={(id, outcome) =>
            setPairings(prev => prev.map(p => p.id === id ? { ...p, outcome } : p))
          }
        />
      )}
    </div>
  )
}

// ── Attendee List ────────────────────────────────────────────

function AttendeeList({ attendees }: { attendees: Attendee[] }) {
  if (!attendees.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Keine Anwesenheiten erfasst.</p>
  }
  return (
    <div className="divide-y divide-border border border-border">
      {attendees.map((a, i) => (
        <div key={a.id} className="flex items-center gap-4 px-4 py-3">
          <span className="w-6 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
          <span className="flex-1 text-sm font-medium text-foreground">{a.full_name ?? 'Unbekannt'}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(a.checked_in_at).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Ratings Panel ────────────────────────────────────────────

function RatingsPanel({
  sessionId,
  ratings,
  onRatingAdded,
}: {
  sessionId: string
  ratings: SessionRating[]
  onRatingAdded: (r: SessionRating) => void
}) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRating) return
    setSaving(true); setError('')
    const res = await upsertSessionRating({ session_id: sessionId, rating: selectedRating, notes: notes || null })
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    onRatingAdded({ id: '', session_id: sessionId, profile_id: '', rating: selectedRating, notes: notes || null, created_at: new Date().toISOString() })
    setSelectedRating(0); setNotes('')
  }

  const displayed = hoveredStar ?? selectedRating

  return (
    <div className="space-y-6">
      {/* Add rating form */}
      <form onSubmit={handleSubmit} className="border border-border bg-card p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Bewertung abgeben (1–10)</p>
        <div className="mb-4 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={() => setSelectedRating(n)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded text-xs font-black transition-colors',
                n <= displayed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-primary/20'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Notiz (optional)"
          className="mb-3 w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={!selectedRating || saving}
          className="bg-primary px-6 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Speichern…' : 'Bewertung speichern'}
        </button>
      </form>

      {/* Rating list */}
      {ratings.length === 0
        ? <p className="py-4 text-center text-sm text-muted-foreground">Noch keine Bewertungen.</p>
        : (
          <div className="divide-y divide-border border border-border">
            {ratings.map(r => (
              <div key={r.id} className="flex items-start gap-4 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center bg-primary text-sm font-black text-primary-foreground">
                  {r.rating}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.profile_name ?? 'Anonym'}</p>
                  {r.notes && <p className="mt-0.5 text-xs text-muted-foreground">{r.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('de-AT')}
                </span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ── Sparring Panel ───────────────────────────────────────────

type Outcome = 'a_wins' | 'b_wins' | 'draw' | null

function SparringPanel({
  sessionId,
  pairings,
  allMembers,
  attendees,
  onPairingAdded,
  onPairingDeleted,
  onOutcomeChanged,
}: {
  sessionId: string
  pairings: SparringPairing[]
  allMembers: Member[]
  attendees: Attendee[]
  onPairingAdded: (p: SparringPairing) => void
  onPairingDeleted: (id: string) => void
  onOutcomeChanged: (id: string, outcome: Outcome) => void
}) {
  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const [rounds, setRounds] = useState(1)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Prefer attendees, fallback to all members
  const selectOptions = attendees.length ? attendees.map(a => ({ id: a.profile_id, full_name: a.full_name })) : allMembers

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!aId || !bId || aId === bId) { setError('Bitte zwei verschiedene Kämpfer wählen.'); return }
    setSaving(true); setError('')
    const res = await addSparringPairing({ session_id: sessionId, profile_a_id: aId, profile_b_id: bId, rounds, notes: notes || null })
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    const aName = selectOptions.find(m => m.id === aId)?.full_name ?? null
    const bName = selectOptions.find(m => m.id === bId)?.full_name ?? null
    onPairingAdded({ id: res.id!, session_id: sessionId, profile_a_id: aId, profile_b_id: bId, profile_a_name: aName, profile_b_name: bName, outcome: null, rounds, notes: notes || null, created_at: new Date().toISOString() })
    setAId(''); setBId(''); setRounds(1); setNotes('')
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteSparringPairing(id, sessionId)
    onPairingDeleted(id)
    setDeleting(null)
  }

  async function handleOutcome(id: string, outcome: Outcome) {
    onOutcomeChanged(id, outcome)
    await updateSparringOutcome(id, outcome, sessionId)
  }

  const selectClass = 'flex-1 border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary'

  return (
    <div className="space-y-6">
      {/* Add pairing */}
      <form onSubmit={handleAdd} className="border border-border bg-card p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Paarung hinzufügen</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={aId} onChange={e => setAId(e.target.value)} className={selectClass} required>
            <option value="">Kämpfer A …</option>
            {selectOptions.map(m => (
              <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
            ))}
          </select>
          <span className="flex items-center text-sm font-black text-muted-foreground">vs.</span>
          <select value={bId} onChange={e => setBId(e.target.value)} className={selectClass} required>
            <option value="">Kämpfer B …</option>
            {selectOptions.map(m => (
              <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
            ))}
          </select>
        </div>
        <div className="mb-3 flex gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Runden</label>
            <input
              type="number" min={1} max={20} value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-16 border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <input
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notiz (optional)"
            className="flex-1 border border-border bg-background px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50">
          <Plus size={12} /> {saving ? 'Speichern…' : 'Paarung hinzufügen'}
        </button>
      </form>

      {/* Pairings list */}
      {pairings.length === 0
        ? <p className="py-4 text-center text-sm text-muted-foreground">Noch keine Paarungen erfasst.</p>
        : (
          <div className="space-y-2">
            {pairings.map((p, i) => (
              <PairingRow
                key={p.id}
                index={i + 1}
                pairing={p}
                onOutcome={o => handleOutcome(p.id, o)}
                onDelete={() => handleDelete(p.id)}
                deleting={deleting === p.id}
              />
            ))}
          </div>
        )
      }
    </div>
  )
}

function PairingRow({
  index, pairing, onOutcome, onDelete, deleting
}: {
  index: number
  pairing: SparringPairing
  onOutcome: (o: Outcome) => void
  onDelete: () => void
  deleting: boolean
}) {
  const [open, setOpen] = useState(false)

  const outcomeColorMap: Record<string, string> = {
    a_wins: 'text-green-500',
    b_wins: 'text-red-500',
    draw: 'text-yellow-500',
  }
  const outcomeColor = pairing.outcome ? (outcomeColorMap[pairing.outcome] ?? 'text-muted-foreground') : 'text-muted-foreground'

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-5 text-xs font-bold text-muted-foreground">{index}.</span>
        <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-foreground">{pairing.profile_a_name ?? 'A'}</span>
          <span className="text-muted-foreground">vs.</span>
          <span className="font-bold text-foreground">{pairing.profile_b_name ?? 'B'}</span>
          {pairing.rounds > 1 && (
            <span className="text-xs text-muted-foreground">({pairing.rounds}R)</span>
          )}
        </div>

        {/* Outcome badge */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={cn('flex items-center gap-1 text-xs font-bold uppercase tracking-wider', outcomeColor)}
          >
            {pairing.outcome ? OUTCOME_LABELS[pairing.outcome] : 'Ergebnis'} <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] border border-border bg-card shadow-lg">
              {([null, 'a_wins', 'b_wins', 'draw'] as Outcome[]).map(o => (
                <button
                  key={String(o)}
                  onClick={() => { onOutcome(o); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                >
                  {pairing.outcome === o && <Check size={10} className="text-primary" />}
                  <span className={cn(pairing.outcome === o ? 'font-bold' : '')}>
                    {o ? OUTCOME_LABELS[o] : '— kein Ergebnis'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {pairing.notes && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">{pairing.notes}</p>
        </div>
      )}
    </div>
  )
}
