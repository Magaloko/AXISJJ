'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getRegistrationsForTournament,
  updateRegistrationStatus,
  type Registration,
} from '@/app/actions/tournament-registrations'

interface Props {
  tournamentId: string
  tournamentName: string
  onClose: () => void
}

export function RegistrationReviewPanel({ tournamentId, tournamentName, onClose }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    getRegistrationsForTournament(tournamentId).then(data => {
      setRegistrations(data)
      setLoading(false)
    })
  }, [tournamentId])

  function review(id: string, status: 'approved' | 'denied') {
    startTransition(async () => {
      const result = await updateRegistrationStatus(id, status)
      if (!result.error) {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{tournamentName}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Anmeldungen
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Lädt…</p>
      ) : registrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Anmeldungen.</p>
      ) : (
        <ul className="space-y-3">
          {registrations.map(r => (
            <li key={r.id} className="border border-border bg-background p-3">
              <p className="text-sm font-bold">{r.memberName}</p>
              <p className="text-xs text-muted-foreground">
                {r.weight_category ?? '—'} · {r.gi_nogi ?? '—'}
              </p>
              {r.notes && <p className="mt-1 text-xs text-muted-foreground italic">{r.notes}</p>}
              <div className="mt-2 flex gap-2 items-center flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 ${
                  r.status === 'approved' ? 'bg-primary/20 text-primary' :
                  r.status === 'denied' ? 'bg-destructive/20 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {r.status === 'approved' ? 'Bestätigt' : r.status === 'denied' ? 'Abgelehnt' : 'Ausstehend'}
                </span>
                {r.status !== 'approved' && (
                  <button disabled={isPending} onClick={() => review(r.id, 'approved')}
                          className="border border-primary px-2 py-1 text-[10px] text-primary">
                    ✓ Bestätigen
                  </button>
                )}
                {r.status !== 'denied' && (
                  <button disabled={isPending} onClick={() => review(r.id, 'denied')}
                          className="border border-destructive px-2 py-1 text-[10px] text-destructive">
                    ✗ Ablehnen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
