import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  streak: number
  totalSessions: number
  lastSessionDate: string | null
  lastGoal: string | null
}

export function MotivationWidget({ streak, totalSessions, lastSessionDate, lastGoal }: Props) {
  const daysSinceLast = lastSessionDate
    ? differenceInDays(new Date(), parseISO(lastSessionDate))
    : null

  function getMotivationMessage() {
    if (totalSessions === 0) return { emoji: '🥋', text: 'Starte deinen ersten Training-Log!' }
    if (streak >= 7) return { emoji: '🔥', text: `${streak} Sessions in Folge — du bist auf einem guten Weg!` }
    if (streak >= 3) return { emoji: '⚡', text: `${streak} Sessions in Folge — bleib dran!` }
    if (daysSinceLast !== null && daysSinceLast > 7) return { emoji: '💪', text: `Komm zurück — letztes Training vor ${daysSinceLast} Tagen.` }
    if (daysSinceLast === 0) return { emoji: '✅', text: 'Gut gemacht — du warst heute dabei!' }
    return { emoji: '🎯', text: `${totalSessions} Trainings gesamt. Weiter so!` }
  }

  const { emoji, text } = getMotivationMessage()

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Motivation</p>
      <p className="mb-4 text-2xl">{emoji}</p>
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
