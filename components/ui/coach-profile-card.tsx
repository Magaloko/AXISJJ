'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { CoachPublicProfile } from '@/app/actions/public-coaches'

const BELT_ORDER = [
  { label: 'White',  color: '#e5e7eb' },
  { label: 'Blue',   color: '#1d4ed8' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Brown',  color: '#78350f' },
  { label: 'Black',  color: '#111111' },
]

function getBeltIndex(beltName: string | null): number {
  if (!beltName) return BELT_ORDER.length - 1 // default to black for coaches
  const lower = beltName.toLowerCase()
  const idx = BELT_ORDER.findIndex(b => lower.includes(b.label.toLowerCase()))
  return idx === -1 ? BELT_ORDER.length - 1 : idx
}

interface Props {
  coach: CoachPublicProfile
  className?: string
}

export function CoachProfileCard({ coach, className }: Props) {
  const activeBeltIdx = getBeltIndex(coach.beltName)

  function BeltBar() {
    return (
      <div className="flex items-center gap-2">
        {BELT_ORDER.map((belt, i) => (
          <div
            key={belt.label}
            title={`${belt.label} Belt`}
            className={cn('h-2 flex-1 rounded-sm transition-opacity', i > activeBeltIdx ? 'opacity-20' : '')}
            style={{
              background: belt.color,
              border: belt.label === 'Black' && i <= activeBeltIdx ? '1px solid oklch(58% 0.21 28)' : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  const photo = coach.avatarUrl ?? '/images/coach-portrait.jpg'
  const role = coach.specialization ?? 'Coach'

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: photo left overlapping card right */}
      <div className="hidden md:flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-[360px] h-[460px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src={photo}
            alt={`${coach.name} — AXIS Jiu-Jitsu`}
            fill
            className="object-cover object-top"
            sizes="360px"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 bg-background rounded-2xl shadow-xl border border-border/40 p-8 pl-24 ml-[-80px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {role}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground mb-2">
            {coach.name.toUpperCase()}
          </h2>

          {coach.achievements && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-6">
              {coach.achievements}
            </p>
          )}

          {coach.bio && (
            <div className="space-y-3 text-sm text-muted-foreground mb-8">
              <p>{coach.bio}</p>
            </div>
          )}

          <BeltBar />
        </motion.div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl mb-6"
        >
          <Image
            src={photo}
            alt={`${coach.name} — AXIS Jiu-Jitsu`}
            width={400}
            height={533}
            className="w-full h-full object-cover object-top"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-background rounded-2xl shadow-xl border border-border/40 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {role}
            </span>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1">
            {coach.name.toUpperCase()}
          </h2>

          {coach.achievements && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4">
              {coach.achievements}
            </p>
          )}

          {coach.bio && (
            <p className="text-sm text-muted-foreground mb-6">{coach.bio}</p>
          )}

          <BeltBar />
        </motion.div>
      </div>
    </div>
  )
}
