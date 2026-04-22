import { MedalIcon, AnimatedGiIcon } from '@/components/ui/icons/animated-icons'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import type { LeaderboardEntry } from '@/app/actions/leaderboard'
import { translations, type Lang } from '@/lib/i18n'

const LOCALE_BY_LANG: Record<Lang, string> = {
  de: 'de-AT',
  en: 'en-US',
  ru: 'ru-RU',
}

interface Props {
  entries: LeaderboardEntry[]
  lang: Lang
}

export function LeaderboardWidget({ entries, lang }: Props) {
  const t = translations[lang].dashboard
  const monthLabel = new Date().toLocaleDateString(LOCALE_BY_LANG[lang], { month: 'long' })

  if (entries.length === 0) {
    return (
      <EmptyStateCard
        label={t.leaderboardLabel}
        title={`${monthLabel} · ${t.leaderboardTop10}`}
        description={
          <span className="inline-flex items-center gap-2">
            {t.leaderboardEmpty}
            <AnimatedGiIcon size={18} animate="hover" />
          </span>
        }
      />
    )
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {t.leaderboardLabel}
      </p>
      <p className="mb-5 text-sm font-semibold text-foreground">
        {monthLabel} · {t.leaderboardTop10}
      </p>
      <div className="space-y-1">
        {entries.map((e) => {
          const isMedal = e.rank >= 1 && e.rank <= 3
          return (
            <div
              key={e.profileId}
              className={`flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-b-0 ${
                e.isMe ? 'bg-primary/5 rounded' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex w-8 items-center justify-center">
                  {isMedal ? (
                    <MedalIcon size={24} place={e.rank as 1 | 2 | 3} animate />
                  ) : (
                    <span className="font-mono text-sm font-bold text-muted-foreground">
                      #{e.rank}
                    </span>
                  )}
                </span>
                <span
                  className={`text-sm ${
                    e.isMe ? 'font-black text-primary' : 'font-semibold text-foreground'
                  }`}
                >
                  {e.fullName}
                  {e.isMe && ` (${t.leaderboardYou})`}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">{e.attendances}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
