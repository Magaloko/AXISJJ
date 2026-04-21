'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveTournament, cancelTournament, type Tournament } from '@/app/actions/tournaments'
import { TournamentForm } from './TournamentForm'
import { RegistrationReviewPanel } from './RegistrationReviewPanel'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  tournaments: Tournament[]
  role: 'coach' | 'owner'
  lang: Lang
}

export function TournamentList({ tournaments, role, lang }: Props) {
  const t = translations[lang].admin.turniere
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
    if (!confirm(t.cancelConfirm)) return
    startTransition(async () => {
      await cancelTournament(id)
      router.refresh()
    })
  }

  function statusLabel(s: Tournament['status']) {
    if (s === 'approved') return { text: t.statusApproved, cls: 'bg-primary/20 text-primary' }
    if (s === 'cancelled') return { text: t.statusCancelled, cls: 'bg-muted text-muted-foreground' }
    return { text: t.statusPending, cls: 'bg-yellow-200 text-yellow-900' }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">{t.title}</h1>
        <button onClick={() => setCreating(true)}
                className="bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
          {t.newButton}
        </button>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-3">
          {tournaments.map(tournament => {
            const s = statusLabel(tournament.status)
            return (
              <li key={tournament.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-black">{tournament.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${s.cls}`}>{s.text}</span>
                      <span className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                        {tournament.type === 'internal' ? t.typeInternal : t.typeExternal}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {tournament.date}{tournament.end_date ? ` – ${tournament.end_date}` : ''} · {tournament.location}
                    </p>
                    {tournament.description && <p className="mt-2 text-xs text-muted-foreground">{tournament.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {tournament.status === 'pending_approval' && role === 'owner' && (
                      <button disabled={isPending} onClick={() => approve(tournament.id)}
                              className="border border-primary px-2 py-1 text-[10px] text-primary">
                        {t.approveBtn}
                      </button>
                    )}
                    {tournament.status === 'approved' && (
                      <button onClick={() => setReviewing(tournament)}
                              className="border border-border px-2 py-1 text-[10px]">
                        {t.registrationsBtn}
                      </button>
                    )}
                    {tournament.status !== 'cancelled' && (
                      <button onClick={() => setEditing(tournament)}
                              className="border border-border px-2 py-1 text-[10px]">
                        {translations[lang].admin.common.edit}
                      </button>
                    )}
                    {tournament.status !== 'cancelled' && (
                      <button disabled={isPending} onClick={() => cancel(tournament.id)}
                              className="border border-destructive px-2 py-1 text-[10px] text-destructive">
                        {t.cancelBtn}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <TournamentForm onClose={() => setCreating(false)} lang={lang} />}
      {editing && <TournamentForm initial={editing} onClose={() => setEditing(null)} lang={lang} />}
      {reviewing && <RegistrationReviewPanel
        tournamentId={reviewing.id}
        tournamentName={reviewing.name}
        onClose={() => setReviewing(null)}
        lang={lang}
      />}
    </div>
  )
}
