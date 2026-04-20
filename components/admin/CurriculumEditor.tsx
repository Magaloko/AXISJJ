'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Plus, Pencil } from 'lucide-react'
import {
  updateCurriculum,
  deleteCurriculum,
  createTrack,
  deleteTrack,
  createSession,
  deleteSession,
} from '@/app/actions/curriculum'

interface Curriculum {
  id: string
  name: string
  description: string | null
  duration_weeks: number
  age_group: 'adults' | 'kids'
  active: boolean
}

interface Session {
  id: string
  week_number: number
  session_number: number
  title: string
  theme: string | null
  duration_minutes: number
}

interface Track {
  id: string
  class_type_id: string
  name: string
  sessions_per_week: number
  class_type_name: string
  sessions: Session[]
}

interface ClassType {
  id: string
  name: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

interface Props {
  curriculum: Curriculum
  tracks: Track[]
  classTypes: ClassType[]
}

export function CurriculumEditor({ curriculum, tracks, classTypes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // ── Curriculum meta
  const [name, setName] = useState(curriculum.name)
  const [description, setDescription] = useState(curriculum.description ?? '')
  const [durationWeeks, setDurationWeeks] = useState(curriculum.duration_weeks)
  const [ageGroup, setAgeGroup] = useState(curriculum.age_group)
  const [active, setActive] = useState(curriculum.active)

  function onSaveMeta() {
    setMessage(null)
    startTransition(async () => {
      const r = await updateCurriculum({
        id: curriculum.id,
        name: name.trim(),
        description: description.trim() || null,
        duration_weeks: durationWeeks,
        age_group: ageGroup,
        active,
      })
      setMessage(r.error
        ? { type: 'err', text: r.error }
        : { type: 'ok',  text: '✓ Gespeichert' })
    })
  }

  function onDeleteCurriculum() {
    if (!confirm(`Lehrplan "${curriculum.name}" wirklich löschen? Alle Tracks und Sessions werden mitgelöscht.`)) return
    startTransition(async () => {
      const r = await deleteCurriculum(curriculum.id)
      if (r.error) setMessage({ type: 'err', text: r.error })
      else router.push('/admin/curriculum')
    })
  }

  // ── Add Track
  const [newTrackClassType, setNewTrackClassType] = useState('')
  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackFreq, setNewTrackFreq] = useState(3)

  function onAddTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!newTrackClassType || !newTrackName.trim()) return
    setMessage(null)
    startTransition(async () => {
      const r = await createTrack({
        curriculum_id:     curriculum.id,
        class_type_id:     newTrackClassType,
        name:              newTrackName.trim(),
        sessions_per_week: newTrackFreq,
      })
      if (r.error) {
        setMessage({ type: 'err', text: r.error })
      } else {
        setNewTrackClassType('')
        setNewTrackName('')
        setNewTrackFreq(3)
        router.refresh()
      }
    })
  }

  function onDeleteTrack(trackId: string, trackName: string) {
    if (!confirm(`Track "${trackName}" löschen? Alle enthaltenen Sessions werden entfernt.`)) return
    startTransition(async () => {
      const r = await deleteTrack(trackId, curriculum.id)
      if (r.error) setMessage({ type: 'err', text: r.error })
      else router.refresh()
    })
  }

  const inputCls = 'w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'

  return (
    <div className="space-y-8">
      {message && (
        <p className={`text-sm ${message.type === 'err' ? 'text-destructive' : 'text-primary'}`}>
          {message.text}
        </p>
      )}

      {/* ── Curriculum Meta ── */}
      <section className="border border-border bg-card p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stammdaten</p>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} maxLength={100} />
          </div>
          <div>
            <label className={labelCls}>Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Dauer (Wochen)</label>
              <input
                type="number" min={1} max={52}
                value={durationWeeks}
                onChange={e => setDurationWeeks(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Zielgruppe</label>
              <select
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value as 'adults' | 'kids')}
                className={inputCls}
              >
                <option value="adults">Erwachsene</option>
                <option value="kids">Kinder</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <label className="flex h-[38px] items-center gap-2 border border-border bg-background px-3 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                {active ? 'Aktiv' : 'Inaktiv'}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onSaveMeta}
            disabled={isPending || name.trim().length < 2}
            className="bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Speichern…' : 'Speichern'}
          </button>
          <button
            onClick={onDeleteCurriculum}
            disabled={isPending}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-destructive hover:underline disabled:opacity-50"
          >
            Lehrplan löschen
          </button>
        </div>
      </section>

      {/* ── Tracks ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracks</p>
          <p className="text-xs text-muted-foreground">
            {tracks.length} Track{tracks.length !== 1 ? 's' : ''} ·{' '}
            {tracks.reduce((sum, t) => sum + t.sessions.length, 0)} Sessions
          </p>
        </div>

        {tracks.length === 0 && (
          <div className="border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Noch keine Tracks angelegt — ein Track = ein Programm (z.B. „Gi Fundamentals" für die `Fundamentals`-Klasse).
          </div>
        )}

        {tracks.map(track => (
          <TrackBlock
            key={track.id}
            track={track}
            curriculumId={curriculum.id}
            durationWeeks={durationWeeks}
            onDelete={() => onDeleteTrack(track.id, track.name)}
            disabled={isPending}
          />
        ))}

        {/* Add track form */}
        <form onSubmit={onAddTrack} className="border border-border bg-card p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Neuen Track hinzufügen
          </p>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto_auto]">
            <div>
              <label className={labelCls}>Klassen-Typ</label>
              <select
                value={newTrackClassType}
                onChange={e => setNewTrackClassType(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">— wählen —</option>
                {classTypes.map(ct => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} ({ct.gi ? 'Gi' : 'No-Gi'}, {ct.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Track-Name</label>
              <input
                value={newTrackName}
                onChange={e => setNewTrackName(e.target.value)}
                placeholder="z.B. Gi Fundamentals"
                className={inputCls}
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className={labelCls}>×/Wo</label>
              <input
                type="number" min={1} max={7}
                value={newTrackFreq}
                onChange={e => setNewTrackFreq(Number(e.target.value))}
                className={`${inputCls} w-16`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isPending || !newTrackClassType || !newTrackName.trim()}
                className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Plus size={16} /> Track
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}

// ─── Track + Session List ────────────────────────────────────

interface TrackBlockProps {
  track: Track
  curriculumId: string
  durationWeeks: number
  onDelete: () => void
  disabled: boolean
}

function TrackBlock({ track, curriculumId, durationWeeks, onDelete, disabled }: TrackBlockProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [week, setWeek] = useState(1)
  const [num, setNum] = useState(1)
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('')
  const [error, setError] = useState<string | null>(null)

  const expectedSessions = durationWeeks * track.sessions_per_week
  const filled = track.sessions.length

  function onAddSession(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await createSession({
        track_id:       track.id,
        week_number:    week,
        session_number: num,
        title:          title.trim(),
        theme:          theme.trim() || undefined,
      })
      if (r.error) {
        setError(r.error)
      } else {
        setTitle('')
        setTheme('')
        // advance to next slot
        if (num < track.sessions_per_week) setNum(num + 1)
        else if (week < durationWeeks) { setWeek(week + 1); setNum(1) }
        router.refresh()
      }
    })
  }

  function onDeleteSession(sessionId: string) {
    if (!confirm('Session löschen?')) return
    startTransition(async () => {
      const r = await deleteSession(sessionId, curriculumId)
      if (r.error) setError(r.error)
      else router.refresh()
    })
  }

  // Group sessions by week for display
  const byWeek = track.sessions.reduce<Record<number, Session[]>>((acc, s) => {
    acc[s.week_number] = acc[s.week_number] ?? []
    acc[s.week_number].push(s)
    return acc
  }, {})

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <p className="font-bold text-foreground">{track.name}</p>
          <p className="text-xs text-muted-foreground">
            {track.class_type_name} · {track.sessions_per_week}×/Woche · {filled}/{expectedSessions} Sessions
          </p>
        </div>
        <button
          onClick={onDelete}
          disabled={disabled}
          aria-label="Track löschen"
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-5">
        {Array.from({ length: durationWeeks }, (_, i) => i + 1).map(w => (
          <div key={w} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Woche {w}</p>
            {(byWeek[w] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground/60">— keine Sessions —</p>
            ) : (
              <div className="space-y-1.5">
                {(byWeek[w] ?? []).map(s => (
                  <div key={s.id} className="flex items-center justify-between border border-border/50 bg-background px-3 py-2 text-sm">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-muted-foreground">#{s.session_number}</span>
                      <span className="font-semibold text-foreground">{s.title}</span>
                      {s.theme && <span className="text-xs text-muted-foreground">· {s.theme}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/curriculum/session/${s.id}`}
                        aria-label="Session bearbeiten"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => onDeleteSession(s.id)}
                        disabled={isPending}
                        aria-label="Session löschen"
                        className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            <Plus size={14} /> Session hinzufügen
          </button>
        ) : (
          <form onSubmit={onAddSession} className="mt-4 border border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-[60px_60px_1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Wo</label>
                <input type="number" min={1} max={durationWeeks} value={week} onChange={e => setWeek(Number(e.target.value))} className="w-full border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">#</label>
                <input type="number" min={1} max={track.sessions_per_week} value={num} onChange={e => setNum(Number(e.target.value))} className="w-full border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Titel</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Closed Guard Basics" required minLength={2} maxLength={120} className="w-full border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Thema</label>
                <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="optional" maxLength={200} className="w-full border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={isPending || title.trim().length < 2} className="bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50">
                  Add
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Abbrechen
                </button>
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
