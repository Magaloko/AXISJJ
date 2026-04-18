// components/admin/SessionCalendar.tsx
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { addWeeks, subWeeks, startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { X } from 'lucide-react'
import { SessionDetailPanel } from './SessionDetailPanel'
import { SessionForm } from './SessionForm'

interface ClassType { id: string; name: string }

interface Session {
  id: string
  starts_at: string
  ends_at: string
  cancelled: boolean
  location: string | null
  capacity: number
  confirmedCount: number
  class_types: { name: string } | null
  class_type_id?: string
}

interface Props {
  initialSessions: Session[]
  classTypes: ClassType[]
}

export function SessionCalendar({ initialSessions, classTypes }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [sessions, setSessions] = useState(initialSessions)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  function sessionsForDay(day: Date) {
    return sessions
      .filter(s => isSameDay(parseISO(s.starts_at), day))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  }

  function handleSessionUpdated(updated: Session) {
    setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
  }

  function handleSessionCancelled(sessionId: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  function handleCreateSuccess(newSession: Record<string, unknown>) {
    const session = newSession as unknown as Session
    setSessions(prev => [...prev, session].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    setShowCreateForm(false)
  }

  function formatTime(iso: string) {
    return format(parseISO(iso), 'HH:mm')
  }

  const weekLabel = `${format(currentWeekStart, 'd. MMM', { locale: de })} – ${format(addDays(currentWeekStart, 6), 'd. MMM yyyy', { locale: de })}`

  return (
    <div>
      {/* Calendar header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
            className="border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
          <button
            onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
            className="border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Nächste Woche"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={() => { setSelectedSession(null); setShowCreateForm(true) }}
          className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          Neue Session
        </button>
      </div>

      {/* 7-column week grid */}
      <div className="grid grid-cols-7 gap-px border border-border bg-border overflow-x-auto">
        {/* Day headers */}
        {days.map(day => {
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={`bg-card px-1 py-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'EEE', { locale: de })}
              </p>
              <p className={`text-sm font-black ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}

        {/* Session cells */}
        {days.map(day => {
          const daySessions = sessionsForDay(day)
          return (
            <div key={day.toISOString() + '-col'} className="min-h-[120px] bg-card p-1">
              {daySessions.map(session => {
                const isFull = session.confirmedCount >= session.capacity
                return (
                  <button
                    key={session.id}
                    onClick={() => { setShowCreateForm(false); setSelectedSession(session) }}
                    className={`mb-1 w-full text-left px-2 py-1.5 text-[11px] transition-colors ${
                      session.cancelled
                        ? 'bg-muted text-muted-foreground line-through'
                        : isFull
                        ? 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300 hover:opacity-80'
                        : 'bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10'
                    }`}
                  >
                    <div className="font-bold truncate">{session.class_types?.name ?? 'Session'}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatTime(session.starts_at)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {session.confirmedCount}/{session.capacity}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedSession && (
        <SessionDetailPanel
          session={selectedSession}
          classTypes={classTypes}
          onClose={() => setSelectedSession(null)}
          onSessionUpdated={handleSessionUpdated}
          onSessionCancelled={handleSessionCancelled}
        />
      )}

      {/* Create panel */}
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
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
