// components/members/NextClassCard.tsx
import Link from 'next/link'
import { formatTime, formatDate } from '@/lib/utils/dates'

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
}

export function NextClassCard({ session, bookingId }: Props) {
  if (!session) {
    return (
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Nächste Klasse</p>
        <p className="mt-4 text-sm text-gray-500">Keine bevorstehende Buchung</p>
        <Link
          href="/members/buchen"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-500"
        >
          Klasse buchen →
        </Link>
      </div>
    )
  }

  const typeName = session.class_types?.name ?? 'Kurs'
  const isGi = session.class_types?.gi ?? true

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Nächste Klasse</p>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{typeName}</h3>
          <p className="mt-1 text-sm text-gray-400">{formatDate(session.starts_at)}</p>
          <p className="text-sm text-gray-400">
            {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
          </p>
          <p className="mt-2 text-xs text-gray-600">{session.location}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-black tracking-widest ${isGi ? 'bg-white/10 text-white' : 'bg-blue-900/30 text-blue-400'}`}>
          {isGi ? 'GI' : 'NO-GI'}
        </span>
      </div>
    </div>
  )
}
