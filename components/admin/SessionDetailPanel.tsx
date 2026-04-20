// components/admin/SessionDetailPanel.tsx
'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { cancelSession } from '@/app/actions/sessions'
import { SessionForm } from './SessionForm'
import { SessionAttendeesList } from './SessionAttendeesList'
import type { Session, Coach } from './SessionCalendar'

interface ClassType { id: string; name: string }

interface Props {
  session: Session
  classTypes: ClassType[]
  coaches: Coach[]
  onClose: () => void
  onSessionUpdated: (session: Session) => void
  onSessionCancelled: (sessionId: string) => void
}

export function SessionDetailPanel({
  session,
  classTypes,
  coaches,
  onClose,
  onSessionUpdated,
  onSessionCancelled,
}: Props) {
  const [mode, setMode] = useState<'detail' | 'edit' | 'duplicate'>('detail')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const result = await cancelSession(session.id)
      if (result.error) { setError(result.error); return }
      onSessionCancelled(session.id)
      onClose()
    })
  }

  return (
    <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-base font-black text-foreground">
          {mode === 'edit'
            ? 'Session bearbeiten'
            : mode === 'duplicate'
            ? 'Session duplizieren'
            : (session.class_types?.name ?? 'Session')}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Panel schließen">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === 'detail' ? (
          <>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Datum & Zeit</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {formatDate(session.starts_at)}<br />
                  {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trainer</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {session.coach_name ?? '— nicht zugewiesen —'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ort</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{session.location ?? 'AXIS Gym'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kapazität</dt>
                <dd className="mt-0.5 font-mono font-semibold text-foreground">
                  {session.confirmedCount} / {session.capacity} Buchungen
                </dd>
              </div>
              {session.cancelled && (
                <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-bold text-destructive">
                  Diese Session wurde abgesagt.
                </div>
              )}
            </dl>

            <div className="mt-6 border-t border-border pt-6">
              <SessionAttendeesList sessionId={session.id} />
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>}

            {!session.cancelled && (
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setMode('edit')}
                  className="w-full border border-border bg-background py-2.5 text-sm font-bold text-foreground hover:bg-muted"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => setMode('duplicate')}
                  className="w-full border border-border bg-background py-2.5 text-sm font-bold text-foreground hover:bg-muted"
                >
                  Duplizieren
                </button>

                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full border border-destructive/30 bg-background py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5"
                  >
                    Absagen
                  </button>
                ) : (
                  <div className="border border-destructive/30 bg-destructive/5 p-4">
                    <p className="mb-3 text-sm font-semibold text-destructive">
                      Session wirklich absagen? Alle Buchenden werden benachrichtigt.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="flex-1 bg-destructive py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {isPending ? '...' : 'Ja, absagen'}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 border border-border py-2 text-sm font-bold text-foreground hover:bg-muted"
                      >
                        Nein
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : mode === 'edit' ? (
          <SessionForm
            isEdit
            initialData={{
              id: session.id,
              class_type_id: session.class_type_id,
              coach_id: session.coach_id,
              starts_at: session.starts_at,
              ends_at: session.ends_at,
              capacity: session.capacity,
              location: session.location ?? 'Strindberggasse 1, 1110 Wien',
            }}
            classTypes={classTypes}
            coaches={coaches}
            onSuccess={(updated) => { onSessionUpdated(updated); onClose() }}
            onCancel={() => setMode('detail')}
          />
        ) : (
          /* duplicate mode — prefill all fields except id; defaults to next-week same weekday */
          <SessionForm
            initialData={{
              class_type_id: session.class_type_id,
              coach_id: session.coach_id,
              starts_at: (() => {
                const d = new Date(session.starts_at)
                d.setDate(d.getDate() + 7)
                return d.toISOString()
              })(),
              ends_at: (() => {
                const d = new Date(session.ends_at)
                d.setDate(d.getDate() + 7)
                return d.toISOString()
              })(),
              capacity: session.capacity,
              location: session.location ?? 'Strindberggasse 1, 1110 Wien',
            }}
            classTypes={classTypes}
            coaches={coaches}
            onSuccess={(newSession) => { onSessionUpdated(newSession); onClose() }}
            onCancel={() => setMode('detail')}
          />
        )}
      </div>
    </div>
  )
}
