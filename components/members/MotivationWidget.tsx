'use client'

import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  FlameIcon,
  LightningIcon,
  StrengthIcon,
  TargetIcon,
  AnimatedCheckIcon,
  AnimatedGiIcon,
} from '@/components/ui/icons/animated-icons'

interface Props {
  streak: number
  totalSessions: number
  lastSessionDate: string | null
  lastGoal: string | null
}

type MotivationIcon = 'gi' | 'flame' | 'lightning' | 'strength' | 'check' | 'target'
type MotivationState = { icon: MotivationIcon; text: string }

const ICON_SIZE = 40

function getMotivationState(
  streak: number,
  totalSessions: number,
  daysSinceLast: number | null,
): MotivationState {
  if (totalSessions === 0) return { icon: 'gi', text: 'Starte deinen ersten Training-Log!' }
  if (streak >= 7) return { icon: 'flame', text: `${streak} Sessions in Folge — du bist auf einem guten Weg!` }
  if (streak >= 3) return { icon: 'lightning', text: `${streak} Sessions in Folge — bleib dran!` }
  if (daysSinceLast !== null && daysSinceLast > 7) return { icon: 'strength', text: `Komm zurück — letztes Training vor ${daysSinceLast} Tagen.` }
  if (daysSinceLast === 0) return { icon: 'check', text: 'Gut gemacht — du warst heute dabei!' }
  return { icon: 'target', text: `${totalSessions} Trainings gesamt. Weiter so!` }
}

function MotivationIconRender({ variant }: { variant: MotivationIcon }) {
  switch (variant) {
    case 'gi':
      return <AnimatedGiIcon size={ICON_SIZE} animate="always" />
    case 'flame':
      return <FlameIcon size={ICON_SIZE} animate="always" />
    case 'lightning':
      return <LightningIcon size={ICON_SIZE} animate="always" />
    case 'strength':
      return <StrengthIcon size={ICON_SIZE} animate="always" />
    case 'check':
      return <AnimatedCheckIcon size={ICON_SIZE} animate="once" />
    case 'target':
      return <TargetIcon size={ICON_SIZE} animate="always" />
  }
}

export function MotivationWidget({ streak, totalSessions, lastSessionDate, lastGoal }: Props) {
  const daysSinceLast = lastSessionDate
    ? differenceInDays(new Date(), parseISO(lastSessionDate))
    : null

  const { icon, text } = getMotivationState(streak, totalSessions, daysSinceLast)

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Motivation</p>
      <div className="mb-4">
        <MotivationIconRender variant={icon} />
      </div>
      <p className="text-sm font-semibold text-foreground">{text}</p>

      {lastGoal && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dein letztes Ziel</p>
          <p className="mt-1 text-sm italic text-foreground">"{lastGoal}"</p>
        </div>
      )}

      {lastSessionDate && (
        <p className="mt-3 text-xs text-muted-foreground">
          Letztes Training: {formatDistanceToNow(parseISO(lastSessionDate), { addSuffix: true, locale: de })}
        </p>
      )}
    </div>
  )
}
