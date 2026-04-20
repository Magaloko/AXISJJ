// components/admin/SessionCalendar.tsx
'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import {
  addDays, addWeeks, addMonths, addQuarters,
  subDays, subWeeks, subMonths, subQuarters,
  startOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  format, isSameDay, isSameMonth, parseISO,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { SessionDetailPanel } from './SessionDetailPanel'
import { SessionForm } from './SessionForm'

export interface Coach { id: string; name: string }
interface ClassType { id: string; name: string }

export interface Session {
  id: string
  starts_at: string
  ends_at: string
  cancelled: boolean
  location: string | null
  capacity: number
  confirmedCount: number
  class_types: { name: string } | null
  class_type_id?: string
  coach_id?: string | null
  coach_name?: string | null
}

interface Props {
  initialSessions: Session[]
  classTypes: ClassType[]
  coaches: Coach[]
}

type ViewMode = 'day' | 'week' | 'month' | 'quarter'

const VIEW_LABELS: Record<ViewMode, string> = {
  day:     'Tag',
  week:    'Woche',
  month:   'Monat',
  quarter: 'Quartal',
}

export function SessionCalendar({ initialSessions, classTypes, coaches }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  function handleSessionUpdated(updated: Session) {
    setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
  }
  function handleSessionCancelled(sessionId: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }
  function handleCreateSuccess(newSession: Session) {
    setSessions(prev => [...prev, newSession].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setShowCreateForm(false)
  }

  function prev() {
    setAnchorDate(d =>
      viewMode === 'day'     ? subDays(d, 1)
    : viewMode === 'week'    ? subWeeks(d, 1)
    : viewMode === 'month'   ? subMonths(d, 1)
                             : subQuarters(d, 1)
    )
  }
  function next() {
    setAnchorDate(d =>
      viewMode === 'day'     ? addDays(d, 1)
    : viewMode === 'week'    ? addWeeks(d, 1)
    : viewMode === 'month'   ? addMonths(d, 1)
                             : addQuarters(d, 1)
    )
  }

  const rangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(anchorDate, 'EEEE, d. MMMM yyyy', { locale: de })
    }
    if (viewMode === 'week') {
      const s = startOfWeek(anchorDate, { weekStartsOn: 1 })
      const e = addDays(s, 6)
      return `${format(s, 'd. MMM', { locale: de })} – ${format(e, 'd. MMM yyyy', { locale: de })}`
    }
    if (viewMode === 'month') {
      return format(anchorDate, 'MMMM yyyy', { locale: de })
    }
    const qs = startOfQuarter(anchorDate)
    return `Q${Math.floor(qs.getMonth() / 3) + 1} ${format(qs, 'yyyy')} (${format(qs, 'MMM', { locale: de })}–${format(endOfQuarter(anchorDate), 'MMM yyyy', { locale: de })})`
  }, [viewMode, anchorDate])

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Zurück"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[180px] text-sm font-semibold text-foreground">{rangeLabel}</span>
          <button
            onClick={next}
            className="border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Weiter"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setAnchorDate(new Date())}
            className="ml-2 border border-border px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Heute
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border">
            {(['day', 'week', 'month', 'quarter'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setSelectedSession(null); setShowCreateForm(true) }}
            className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus size={16} />
            Neue Session
          </button>
        </div>
      </div>

      {/* View body */}
      {viewMode === 'day'     && <DayView     anchor={anchorDate} sessions={sessions} onSelect={s => { setShowCreateForm(false); setSelectedSession(s) }} />}
      {viewMode === 'week'    && <WeekView    anchor={anchorDate} sessions={sessions} onSelect={s => { setShowCreateForm(false); setSelectedSession(s) }} />}
      {viewMode === 'month'   && <MonthView   anchor={anchorDate} sessions={sessions} onSelect={s => { setShowCreateForm(false); setSelectedSession(s) }} onDateClick={d => { setAnchorDate(d); setViewMode('day') }} />}
      {viewMode === 'quarter' && <QuarterView anchor={anchorDate} sessions={sessions} onDateClick={d => { setAnchorDate(d); setViewMode('day') }} />}

      {selectedSession && (
        <SessionDetailPanel
          session={selectedSession}
          classTypes={classTypes}
          coaches={coaches}
          onClose={() => setSelectedSession(null)}
          onSessionUpdated={handleSessionUpdated}
          onSessionCancelled={handleSessionCancelled}
        />
      )}

      {showCreateForm && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-black text-foreground">Neue Session</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground" aria-label="Panel schließen">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <SessionForm
              classTypes={classTypes}
              coaches={coaches}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ────────── Shared helpers ──────────

function formatTime(iso: string) {
  return format(parseISO(iso), 'HH:mm')
}

function SessionCard({ session, onSelect, compact = false }: { session: Session; onSelect: (s: Session) => void; compact?: boolean }) {
  const isFull = session.confirmedCount >= session.capacity
  const cls = session.cancelled
    ? 'bg-muted text-muted-foreground line-through'
    : isFull
    ? 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300 hover:opacity-80'
    : 'border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10'

  if (compact) {
    return (
      <button
        onClick={() => onSelect(session)}
        className={`w-full truncate px-1 py-0.5 text-left text-[10px] leading-tight transition-colors ${cls}`}
        title={`${session.class_types?.name ?? 'Session'} ${formatTime(session.starts_at)}`}
      >
        <span className="font-mono">{formatTime(session.starts_at)}</span> {session.class_types?.name ?? 'Session'}
      </button>
    )
  }

  return (
    <button
      onClick={() => onSelect(session)}
      className={`mb-1 w-full px-2 py-1.5 text-left text-[11px] transition-colors ${cls}`}
    >
      <div className="truncate font-bold">{session.class_types?.name ?? 'Session'}</div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
      </div>
      {session.coach_name && (
        <div className="truncate text-[10px] text-muted-foreground">{session.coach_name}</div>
      )}
      <div className="text-[10px] text-muted-foreground">
        {session.confirmedCount}/{session.capacity}
      </div>
    </button>
  )
}

function sessionsForDay(sessions: Session[], day: Date): Session[] {
  return sessions
    .filter(s => isSameDay(parseISO(s.starts_at), day))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

// ────────── Day view ──────────

function DayView({ anchor, sessions, onSelect }: { anchor: Date; sessions: Session[]; onSelect: (s: Session) => void }) {
  const daySessions = sessionsForDay(sessions, anchor)
  return (
    <div className="border border-border bg-card p-4 sm:p-6">
      {daySessions.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Keine Sessions an diesem Tag.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {daySessions.map(s => (
            <SessionCard key={s.id} session={s} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────── Week view ──────────

function WeekView({ anchor, sessions, onSelect }: { anchor: Date; sessions: Session[]; onSelect: (s: Session) => void }) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="grid grid-cols-7 gap-px overflow-x-auto border border-border bg-border">
      {days.map(day => {
        const isToday = isSameDay(day, new Date())
        return (
          <div key={day.toISOString()} className={`bg-card px-1 py-2 text-center ${isToday ? 'bg-primary/5' : ''}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {format(day, 'EEE', { locale: de })}
            </p>
            <p className={`text-sm font-black ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {format(day, 'd')}
            </p>
          </div>
        )
      })}
      {days.map(day => (
        <div key={day.toISOString() + '-col'} className="min-h-[120px] bg-card p-1">
          {sessionsForDay(sessions, day).map(s => (
            <SessionCard key={s.id} session={s} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ────────── Month view ──────────

function MonthView({
  anchor, sessions, onSelect, onDateClick,
}: {
  anchor: Date; sessions: Session[]; onSelect: (s: Session) => void; onDateClick: (d: Date) => void
}) {
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  // Render exactly 6 weeks for consistent grid
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekdayLabels = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']

  return (
    <div className="border border-border bg-border">
      <div className="grid grid-cols-7 gap-px bg-border">
        {weekdayLabels.map(label => (
          <div key={label} className="bg-card px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        ))}
        {cells.map(day => {
          const inMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())
          const daySessions = sessionsForDay(sessions, day)
          const afterEnd = day > monthEnd
          const beforeStart = day < monthStart
          const muted = !inMonth || afterEnd || beforeStart
          return (
            <div
              key={day.toISOString()}
              className={`group min-h-[90px] bg-card p-1 ${muted ? 'opacity-40' : ''}`}
            >
              <button
                onClick={() => onDateClick(day)}
                className={`mb-1 block text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground'} hover:underline`}
              >
                {format(day, 'd')}
              </button>
              <div className="flex flex-col gap-0.5">
                {daySessions.slice(0, 3).map(s => (
                  <SessionCard key={s.id} session={s} onSelect={onSelect} compact />
                ))}
                {daySessions.length > 3 && (
                  <button
                    onClick={() => onDateClick(day)}
                    className="text-left text-[10px] text-muted-foreground hover:text-primary"
                  >
                    +{daySessions.length - 3} mehr
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────── Quarter view ──────────

function QuarterView({
  anchor, sessions, onDateClick,
}: {
  anchor: Date; sessions: Session[]; onDateClick: (d: Date) => void
}) {
  const qStart = startOfQuarter(anchor)
  const months = [qStart, addMonths(qStart, 1), addMonths(qStart, 2)]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {months.map(month => (
        <QuarterMonthMini key={month.toISOString()} month={month} sessions={sessions} onDateClick={onDateClick} />
      ))}
    </div>
  )
}

function QuarterMonthMini({ month, sessions, onDateClick }: { month: Date; sessions: Session[]; onDateClick: (d: Date) => void }) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekdayLabels = ['M', 'D', 'M', 'D', 'F', 'S', 'S']

  return (
    <div className="border border-border bg-card p-3">
      <p className="mb-3 text-sm font-black text-foreground">
        {format(month, 'MMMM yyyy', { locale: de })}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="text-center text-[9px] font-bold uppercase text-muted-foreground">
            {label}
          </div>
        ))}
        {cells.map(day => {
          const inMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())
          const afterEnd = day > monthEnd
          const beforeStart = day < monthStart
          const muted = !inMonth || afterEnd || beforeStart
          const count = sessionsForDay(sessions, day).length

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={`
                relative aspect-square text-[11px] transition-colors
                ${muted ? 'text-muted-foreground/40' : 'text-foreground hover:bg-muted'}
                ${isToday ? 'bg-primary/10 font-black text-primary' : ''}
              `}
            >
              <span>{format(day, 'd')}</span>
              {count > 0 && !muted && (
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
