'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'
import type { TournamentPublic } from '@/app/actions/public-tournaments'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  tournament: TournamentPublic
  index: number
  lang: Lang
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TournamentCard({ tournament, index, lang }: Props) {
  const { name, date, endDate, location, type, description, approvedParticipants } = tournament
  const tt = translations[lang].public.tournaments

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-border bg-background rounded-xl p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-xl font-black text-foreground">{name}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
          type === 'internal' ? 'bg-primary/20 text-primary' : 'bg-foreground/10 text-foreground'
        }`}>
          {type === 'internal' ? tt.typeInternal : tt.typeExternal}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1 font-mono">
          <Calendar size={12} />
          {formatDate(date)}{endDate ? ` – ${formatDate(endDate)}` : ''}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {location}
        </span>
      </div>

      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}

      {approvedParticipants.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {approvedParticipants.length} {tt.participantsConfirmed}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {approvedParticipants.map((p, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 w-16">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border border-border mb-1 relative">
                  {p.avatarUrl ? (
                    <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {p.name[0]}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-center truncate w-full">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  )
}
