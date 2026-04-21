import { translations, type Lang } from '@/lib/i18n'

interface StatsBarProps {
  lang: Lang
}

export function StatsBar({ lang }: StatsBarProps) {
  const ts = translations[lang].public.stats
  const STATS = [
    { value: '10+',  label: ts.classesPerWeek,  sublabel: ts.classesPerWeekSub },
    { value: 'GI',   label: ts.bothStyles,       sublabel: ts.bothStylesSub },
    { value: '⬛ BB', label: ts.blackBeltCoach,  sublabel: ts.blackBeltCoachSub },
    { value: 'KIDS', label: ts.kidsWelcome,      sublabel: ts.kidsWelcomeSub },
  ]

  return (
    <div className="border-t border-primary/30 bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-6 sm:grid-cols-4 sm:px-6">
        {STATS.map(stat => (
          <div key={stat.label} className="flex flex-col items-center px-4 py-4 text-center">
            <span
              className="mb-1 text-2xl font-black text-primary sm:text-3xl"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {stat.value}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{stat.label}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{stat.sublabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
