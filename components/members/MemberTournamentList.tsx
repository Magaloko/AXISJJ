'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerForTournament } from '@/app/actions/tournament-registrations'
import type { Tournament } from '@/app/actions/tournaments'
import { translations, type Lang } from '@/lib/i18n'

interface MyReg {
  tournamentId: string
  status: 'pending' | 'approved' | 'denied'
}

interface Props {
  tournaments: Tournament[]
  myRegistrations: MyReg[]
  lang: Lang
}

export function MemberTournamentList({ tournaments, myRegistrations, lang }: Props) {
  const t = translations[lang].admin.memberTurniere

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ weight_category: '', gi_nogi: 'gi' as 'gi' | 'nogi' | 'both', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function myStatus(tournamentId: string) {
    return myRegistrations.find(r => r.tournamentId === tournamentId)?.status ?? null
  }

  function submit(tournamentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await registerForTournament(tournamentId, {
        weight_category: form.weight_category || null,
        gi_nogi: form.gi_nogi,
        notes: form.notes || null,
      })
      if (result.error) { setError(result.error); return }
      setExpandedId(null)
      setForm({ weight_category: '', gi_nogi: 'gi', notes: '' })
      router.refresh()
    })
  }

  function statusBadge(status: 'pending' | 'approved' | 'denied' | null) {
    if (status === 'approved') return <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary">{t.badgeApproved}</span>
    if (status === 'denied') return <span className="text-[10px] font-bold px-2 py-0.5 bg-destructive/20 text-destructive">{t.badgeDenied}</span>
    if (status === 'pending') return <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-200 text-yellow-900">{t.badgePending}</span>
    return null
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black">{t.title}</h1>
      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-3">
          {tournaments.map(tournament => {
            const status = myStatus(tournament.id)
            const canRegister = status === null || status === 'denied'
            const deadlinePassed = tournament.registration_deadline
              ? new Date(tournament.registration_deadline) < new Date()
              : false
            return (
              <li key={tournament.id} className="border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-black">{tournament.name}</p>
                      <span className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                        {tournament.type === 'internal' ? t.typeInternal : t.typeExternal}
                      </span>
                      {statusBadge(status)}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {tournament.date}{tournament.end_date ? ` – ${tournament.end_date}` : ''} · {tournament.location}
                    </p>
                    {tournament.description && <p className="mt-2 text-xs text-muted-foreground">{tournament.description}</p>}
                    {tournament.registration_deadline && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {t.deadlinePrefix} {tournament.registration_deadline}
                      </p>
                    )}
                  </div>
                  {canRegister && !deadlinePassed && (
                    <button onClick={() => setExpandedId(expandedId === tournament.id ? null : tournament.id)}
                            className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                      {expandedId === tournament.id ? t.cancelBtn : t.registerBtn}
                    </button>
                  )}
                </div>

                {expandedId === tournament.id && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{t.weightClass}</label>
                      <input className="w-full border border-border bg-background p-2 text-sm"
                             placeholder="-70kg"
                             value={form.weight_category}
                             onChange={e => setForm({ ...form, weight_category: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{t.giNogiLabel}</label>
                      <div className="flex gap-3 text-sm">
                        {(['gi', 'nogi', 'both'] as const).map(v => (
                          <label key={v} className="flex items-center gap-1">
                            <input type="radio" name={`gi-${tournament.id}`} checked={form.gi_nogi === v}
                                   onChange={() => setForm({ ...form, gi_nogi: v })} />
                            {v === 'gi' ? t.giOption : v === 'nogi' ? t.nogiOption : t.bothOption}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">{t.notes}</label>
                      <textarea rows={2} className="w-full border border-border bg-background p-2 text-sm"
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <button onClick={() => submit(tournament.id)} disabled={isPending}
                            className="bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
                      {isPending ? t.submitting : t.submit}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
