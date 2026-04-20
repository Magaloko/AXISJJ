'use client'

import { useEffect, useState, useTransition } from 'react'
import { getSessionNotes, upsertSessionNote, type SessionNote } from '@/app/actions/session-notes'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props { sessionId: string }

export function SessionNotesPanel({ sessionId }: Props) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('')
  const [reflection, setReflection] = useState('')
  const [myNoteLoaded, setMyNoteLoaded] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function refresh() {
    const data = await getSessionNotes(sessionId)
    setNotes(data)
    setLoading(false)

    if (!myNoteLoaded) {
      const mine = data.find(n => n.is_mine)
      if (mine) {
        setPlan(mine.plan ?? '')
        setReflection(mine.reflection ?? '')
      }
      setMyNoteLoaded(true)
    }
  }

  useEffect(() => { refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sessionId])

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const result = await upsertSessionNote({ session_id: sessionId, plan, reflection })
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: '✓ Gespeichert' })
        refresh()
      }
    })
  }

  const otherNotes = notes.filter(n => !n.is_mine)

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Lektions-Notizen
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Plan (vor der Session)
          </label>
          <textarea
            value={plan}
            onChange={e => setPlan(e.target.value)}
            rows={3}
            placeholder="Techniken, Warm-up, Sparring-Ziel..."
            className="w-full resize-none border border-border bg-background p-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Reflexion (nach der Session)
          </label>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            rows={3}
            placeholder="Was lief gut? Was lief schlecht? Wer war auffällig?"
            className="w-full resize-none border border-border bg-background p-2 text-sm outline-none focus:border-primary"
          />
        </div>
        {message && (
          <p className={`text-xs ${message.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
            {message.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || (!plan.trim() && !reflection.trim())}
          className="w-full bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Speichere...' : 'Meine Notiz speichern'}
        </button>
      </div>

      {/* Other coaches' notes */}
      {!loading && otherNotes.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Notizen anderer Trainer
          </p>
          <div className="space-y-2">
            {otherNotes.map(n => (
              <div key={n.id} className="border border-border bg-background p-3">
                <p className="text-[10px] text-muted-foreground mb-1">
                  {n.author_name ?? 'Unbekannt'} · {formatDistanceToNow(parseISO(n.updated_at), { addSuffix: true, locale: de })}
                </p>
                {n.plan && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan</p>
                    <p className="whitespace-pre-wrap text-xs text-foreground">{n.plan}</p>
                  </div>
                )}
                {n.reflection && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reflexion</p>
                    <p className="whitespace-pre-wrap text-xs text-foreground">{n.reflection}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
