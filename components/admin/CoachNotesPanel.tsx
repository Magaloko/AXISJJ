'use client'

import { useState, useTransition, useEffect } from 'react'
import { addCoachNote, updateCoachNote, deleteCoachNote, getCoachNotes, type CoachNote } from '@/app/actions/coach-notes'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  profileId: string
}

export function CoachNotesPanel({ profileId }: Props) {
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getCoachNotes(profileId).then(result => {
      if (!cancelled) {
        setNotes(result)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [profileId])

  function handleAdd() {
    if (!newContent.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await addCoachNote({ profile_id: profileId, content: newContent })
      if (result.error) { setError(result.error); return }
      setNewContent('')
      const fresh = await getCoachNotes(profileId)
      setNotes(fresh)
    })
  }

  function handleSaveEdit(id: string) {
    if (!editingContent.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await updateCoachNote({ id, content: editingContent })
      if (result.error) { setError(result.error); return }
      setEditingId(null)
      setEditingContent('')
      const fresh = await getCoachNotes(profileId)
      setNotes(fresh)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Notiz löschen?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCoachNote(id)
      if (result.error) { setError(result.error); return }
      setNotes(prev => prev.filter(n => n.id !== id))
    })
  }

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Coach-Notizen
      </p>

      <p className="mb-3 text-[10px] text-muted-foreground">
        Private Notizen für Coaches/Owner. Nicht sichtbar für das Mitglied.
      </p>

      {/* Add form */}
      <div className="mb-4 space-y-2">
        <textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Neue Notiz..."
          rows={2}
          maxLength={2000}
          className="w-full resize-none border border-border bg-background p-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newContent.trim()}
          className="w-full bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50 hover:opacity-90"
        >
          {isPending ? '...' : 'Notiz hinzufügen'}
        </button>
      </div>

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      {/* List */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Lade Notizen...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Noch keine Notizen.</p>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="border border-border bg-background p-3">
              {editingId === n.id ? (
                <>
                  <textarea
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    rows={2}
                    className="mb-2 w-full resize-none border border-border bg-card p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(n.id)}
                      disabled={isPending}
                      className="flex-1 bg-primary py-1 text-xs font-bold text-primary-foreground"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditingContent('') }}
                      className="flex-1 border border-border py-1 text-xs"
                    >
                      Abbrechen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 whitespace-pre-wrap text-sm text-foreground">{n.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {n.author_name ?? 'Unbekannt'} ·{' '}
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: de })}
                    </span>
                    {n.is_mine && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingId(n.id); setEditingContent(n.content) }}
                          className="hover:text-foreground"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-destructive hover:opacity-70"
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
