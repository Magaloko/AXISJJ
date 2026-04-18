// components/members/ClassSlot.tsx
'use client'

import { useState } from 'react'
import { formatTime } from '@/lib/utils/dates'
import { bookClass, cancelBooking } from '@/app/actions/bookings'
import { translations, type Lang } from '@/lib/i18n'

interface Session {
  id: string
  starts_at: string
  ends_at: string
  capacity: number
  location: string
  class_types: { name: string; gi: boolean; level: string } | null
}

interface UserBooking {
  id: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
}

interface Props {
  session: Session
  userBooking: UserBooking | null
  confirmedCount: number
  lang?: Lang
}

export function ClassSlot({ session, userBooking, confirmedCount, lang = 'de' }: Props) {
  const t = translations[lang].classSlot
  const [pending, setPending] = useState(false)
  const [booking, setBooking] = useState<UserBooking | null>(userBooking)
  const [count, setCount] = useState(confirmedCount)
  const [error, setError] = useState<string | null>(null)

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true
  const isFull = count >= session.capacity

  const handleBook = async () => {
    setError(null)
    setPending(true)
    const result = await bookClass(session.id)
    if (result.success) {
      setBooking({ id: 'pending', status: result.status === 'confirmed' ? 'confirmed' : 'waitlisted' })
      if (result.status === 'confirmed') setCount(c => c + 1)
    } else {
      setError(result.error ?? t.errorBook)
    }
    setPending(false)
  }

  const handleCancel = async () => {
    if (!booking) return
    setError(null)
    setPending(true)
    const result = await cancelBooking(booking.id)
    if (result.success) {
      if (booking.status === 'confirmed') setCount(c => c - 1)
      setBooking(null)
    } else {
      setError(result.error ?? t.errorCancel)
    }
    setPending(false)
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{typeName}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-black tracking-widest ${
              isGi ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isGi ? 'GI' : 'NO-GI'}
          </span>
          {booking?.status === 'confirmed' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-green-100 text-green-700">
              {t.booked}
            </span>
          )}
          {booking?.status === 'waitlisted' && (
            <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest bg-yellow-100 text-yellow-700">
              {t.waitlisted}
            </span>
          )}
        </div>
        <p
          className="mt-0.5 text-xs text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          &nbsp;·&nbsp;
          <span className={count >= session.capacity ? 'text-destructive' : ''}>
            {count}/{session.capacity}
          </span>
        </p>
      </div>

      <div className="ml-4 flex-shrink-0">
        {booking?.status === 'confirmed' || booking?.status === 'waitlisted' ? (
          <button
            onClick={handleCancel}
            disabled={pending || booking.id === 'pending'}
            aria-label={`${typeName} ${t.cancel}`}
            className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {pending ? '...' : t.cancel}
          </button>
        ) : isFull ? (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.full}</span>
        ) : (
          <button
            onClick={handleBook}
            disabled={pending}
            aria-label={`${typeName} ${t.book}`}
            className="bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {pending ? '...' : t.book}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
