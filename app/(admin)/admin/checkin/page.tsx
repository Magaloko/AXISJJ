// app/(admin)/admin/checkin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTodaySessions, getSessionBookings } from '@/app/actions/admin'
import { CheckInScanner } from '@/components/admin/CheckInScanner'
import { CheckInList } from '@/components/admin/CheckInList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Check-In | Admin' }

interface Props {
  searchParams: Promise<{ session?: string }>
}

export default async function CheckInPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const sessionsResult = await getTodaySessions()
  const sessions = sessionsResult.sessions ?? []

  // Default to first session after now, or last session of the day
  const now = new Date()
  const upcoming = sessions.find(s => new Date(s.starts_at) > now)
  const defaultSession = upcoming ?? sessions[sessions.length - 1] ?? null
  const selectedId = params.session ?? defaultSession?.id ?? null

  const bookingsResult = selectedId ? await getSessionBookings(selectedId) : null
  const bookings = bookingsResult?.bookings ?? []

  const selectedSession = sessions.find(s => s.id === selectedId) ?? null

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-foreground">Check-In</h1>

      {/* Session selector */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Session wählen
        </label>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Sessions heute.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sessions.map(s => (
              <a
                key={s.id}
                href={`/admin/checkin?session=${s.id}`}
                className={`border px-4 py-2 text-sm font-semibold transition-colors ${
                  s.id === selectedId
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {s.class_types?.name ?? 'Session'} · {formatTime(s.starts_at)}
              </a>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <>
          <div className="mb-4 text-sm font-semibold text-muted-foreground">
            {selectedSession.class_types?.name} · {formatTime(selectedSession.starts_at)} – {formatTime(selectedSession.ends_at)} · {selectedSession.location ?? 'AXIS Gym'}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* QR Scanner */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                QR-Code scannen
              </p>
              <CheckInScanner
                sessionId={selectedSession.id}
                onCheckedIn={() => {}}
              />
            </div>

            {/* Manual list */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Buchungsliste
              </p>
              <CheckInList
                sessionId={selectedSession.id}
                initialBookings={bookings}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
