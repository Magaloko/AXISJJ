'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CoachProfileCard } from '@/components/ui/coach-profile-card'
import { cn } from '@/lib/utils/cn'
import type { CoachPublicProfile } from '@/app/actions/public-coaches'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  coaches: CoachPublicProfile[]
  lang: Lang
}

export function CoachSlider({ coaches, lang }: Props) {
  const [index, setIndex] = useState(0)
  const t = translations[lang].public.coaches

  if (coaches.length === 0) return null
  if (coaches.length === 1) return <CoachProfileCard coach={coaches[0]} lang={lang} />

  const prev = () => setIndex(i => (i - 1 + coaches.length) % coaches.length)
  const next = () => setIndex(i => (i + 1) % coaches.length)

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={coaches[index].profileId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
        >
          <CoachProfileCard coach={coaches[index]} lang={lang} />
        </motion.div>
      </AnimatePresence>

      {/* Arrows — desktop only */}
      <button
        onClick={prev}
        aria-label={t.prevCoach}
        className="absolute left-0 top-1/2 hidden -translate-y-1/2 -translate-x-10 rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground md:block"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label={t.nextCoach}
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-10 rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground md:block"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="mt-8 flex justify-center gap-2">
        {coaches.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Coach ${i + 1}`}
            className={cn(
              'h-1.5 rounded-sm transition-all',
              i === index ? 'w-8 bg-primary' : 'w-4 bg-muted',
            )}
          />
        ))}
      </div>

      {/* Mobile prev/next buttons */}
      <div className="mt-4 flex justify-center gap-4 md:hidden">
        <button onClick={prev} className="border border-border p-2 text-muted-foreground">
          <ChevronLeft size={16} />
        </button>
        <button onClick={next} className="border border-border p-2 text-muted-foreground">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
