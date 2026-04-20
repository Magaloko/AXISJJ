'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveTournament, cancelTournament, type Tournament } from '@/app/actions/tournaments'
import { TournamentForm } from './TournamentForm'
import { RegistrationReviewPanel } from './RegistrationReviewPanel'

interface Props {
  tournaments: Tournament[]
  role: 'coach' | 'owner'
}

export function TournamentList({ tournaments, role }: Props) {
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [creating, setCreating] = useState(false)
  const [reviewing, setReviewing] = useState<Tournament | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function approve(id: string) {
    startTransition(async () => {
      await approveTournament(id)
      router.refresh()
    })
  }

  function cancel(id: string) {
    if (!confirm('Turnier absagen?')) return
    startTransition(async () => {
      await cancelTournament(id)
      router.refresh()
    })
  }

  function statusLabel(s: Tournament['status']) {
    if (s === 'approved') return { text: 'Genehmigt', cls: 'bg-primary/20 text-primary' }
    if (s === 'cancelled') return { text: 'Abgesagt', cls: 'bg-muted text-muted-foreground' }
    return { text: 'Ausstehend', cls: 'bg-yellow-200 text-yellow-900' }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">Turniere</h1>
        <button onClick={() => setCreating(true)}
                className="bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
          + Neues Turnier
        </button>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Turniere.</p>
      ) : (
        <ul className="space-y-3">
          {tournaments.map(t => {
            const s = statusLabel(t.status)
            return (
              <li key={t.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-black">{t.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${s.cls}`}>{s.text}</span>
                      <span className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                        {t.type === 'internal' ? 'Intern' : 'Extern'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {t.date}{t.end_date ? ` – ${t.end_date}` : ''} · {t.location}
                    </p>
                    {t.description && <p className="mt-2 text-xs text-muted-foreground">{t.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {t.status === 'pending_approval' && role === 'owner' && (
                      <button disabled={isPending} onClick={() => approve(t.id)}
                              className="border border-primary px-2 py-1 text-[10px] text-primary">
                        ✓ Genehmigen
                      </button>
                    )}
                    {t.status === 'approved' && (
                      <button onClick={() => setReviewing(t)}
                              className="border border-border px-2 py-1 text-[10px]">
                        Anmeldungen
                      </button>
                    )}
                    {t.status !== 'cancelled' && (
                      <button onClick={() => setEditing(t)}
                              className="border border-border px-2 py-1 text-[10px]">
                        Edit
                      </button>
                    )}
                    {t.status !== 'cancelled' && (
                      <button disabled={isPending} onClick={() => cancel(t.id)}
                              className="border border-destructive px-2 py-1 text-[10px] text-destructive">
                        Absagen
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <TournamentForm onClose={() => setCreating(false)} />}
      {editing && <TournamentForm initial={editing} onClose={() => setEditing(null)} />}
      {reviewing && <RegistrationReviewPanel
        tournamentId={reviewing.id}
        tournamentName={reviewing.name}
        onClose={() => setReviewing(null)}
      />}
    </div>
  )
}
