// components/admin/CheckInList.tsx
'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { checkIn } from '@/app/actions/checkin'
import type { BookingWithAttendance } from '@/app/actions/admin'

interface Props {
  sessionId: string
  initialBookings: BookingWithAttendance[]
}

export function CheckInList({ sessionId, initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings)
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const checkedInCount = bookings.filter(b => b.checkedInAt).length

  function sortBookings(list: BookingWithAttendance[]) {
    return [...list].sort((a, b) => {
      if (a.checkedInAt && !b.checkedInAt) return 1
      if (!a.checkedInAt && b.checkedInAt) return -1
      return a.memberName.localeCompare(b.memberName)
    })
  }

  // Called by CheckInScanner when a QR scan succeeds
  function handleQRCheckIn(profileId: string) {
    const now = new Date().toISOString()
    setBookings(prev =>
      sortBookings(prev.map(b => b.profile_id === profileId ? { ...b, checkedInAt: now } : b))
    )
  }

  async function handleManualCheckIn(booking: BookingWithAttendance) {
    if (booking.checkedInAt) return
    setLoadingId(booking.id)
    startTransition(async () => {
      const result = await checkIn(booking.profile_id, sessionId)
      if (result.success) {
        const now = new Date().toISOString()
        setBookings(prev =>
          sortBookings(prev.map(b => b.profile_id === booking.profile_id ? { ...b, checkedInAt: now } : b))
        )
      }
      setLoadingId(null)
    })
  }

  return (
    <div>
      <div className="mb-3">
        <span className="text-sm font-bold text-foreground">
          {checkedInCount} / {bookings.length} eingecheckt
        </span>
      </div>

      <div className="space-y-1.5">
        {bookings.map(booking => (
          <div
            key={booking.id}
            className={`flex items-center justify-between border px-4 py-3 transition-colors ${
              booking.checkedInAt
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                : 'border-border bg-card'
            }`}
          >
            <span className="text-sm font-semibold text-foreground">{booking.memberName}</span>

            {booking.checkedInAt ? (
              <span className="font-mono text-xs text-green-700 dark:text-green-400">
                ✓ {format(new Date(booking.checkedInAt), 'HH:mm', { locale: de })}
              </span>
            ) : (
              <button
                onClick={() => handleManualCheckIn(booking)}
                disabled={isPending && loadingId === booking.id}
                className="border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {isPending && loadingId === booking.id ? '...' : 'Einchecken'}
              </button>
            )}
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Keine Buchungen für diese Session.
          </p>
        )}
      </div>
    </div>
  )
}
