// components/members/NextClassCard.tsx
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/utils/dates'
import { translations, type Lang } from '@/lib/i18n'

interface ClassSession {
  id: string
  starts_at: string
  ends_at: string
  location: string
  class_types: { name: string; gi: boolean; level: string } | null
}

interface Props {
  session: ClassSession | null
  bookingId: string | null
  lang?: Lang
}

export function NextClassCard({ session, bookingId, lang = 'de' }: Props) {
  const t = translations[lang].nextClassCard

  if (!session) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t.noBooking}</p>
        <Link
          href="/buchen"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80"
        >
          {t.bookCta}
        </Link>
      </div>
    )
  }

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true

  return (
    <div className="border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-foreground">{typeName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(session.starts_at)}</p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{session.location}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-black tracking-widest ${
            isGi ? 'bg-muted text-foreground' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isGi ? 'GI' : 'NO-GI'}
        </span>
      </div>
    </div>
  )
}
