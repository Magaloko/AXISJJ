// components/members/BeltProgress.tsx
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  beltName: string | null
  stripes: number
  colorHex: string | null
  readiness: number
  sessionsAttended: number
  monthsInGrade: number
  lang?: Lang
}

export function BeltProgress({ beltName, stripes, colorHex, readiness, sessionsAttended, monthsInGrade, lang = 'de' }: Props) {
  const t = translations[lang].belt

  if (!beltName) {
    return (
      <div className="border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t.noRank}</p>
      </div>
    )
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const clampedReadiness = Math.min(100, Math.max(0, readiness))
  const offset = circumference - (clampedReadiness / 100) * circumference
  const beltColor = colorHex ?? '#e5e7eb'

  return (
    <div className="border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.heading}</p>

      <div className="mt-4 flex items-center gap-6">
        {/* SVG progress ring */}
        <svg
          role="img"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-label={`${beltName} Belt, ${stripes} ${t.stripes}. ${t.readinessLabel}: ${clampedReadiness}%. ${sessionsAttended} ${t.trainings}, ${monthsInGrade} ${t.months}.`}
        >
          {/* Track ring — use border color for light theme visibility */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke="oklch(88% 0.006 80)"
            strokeWidth="5"
          />
          {/* Progress ring */}
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={beltColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
          />
          {/* Percentage text — dark ink color for light theme */}
          <text
            x="40" y="45"
            textAnchor="middle"
            fill="oklch(16% 0.010 60)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="var(--font-mono)"
          >
            {clampedReadiness}%
          </text>
        </svg>

        {/* Belt info */}
        <div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-16 rounded-sm"
              style={{
                backgroundColor: beltColor,
                border: beltColor === '#111111' ? '1px solid oklch(58% 0.21 28)' : undefined,
              }}
            />
          </div>
          <p className="mt-2 text-xl font-black text-foreground">{beltName} Belt</p>
          <p className="text-xs text-muted-foreground">{stripes} {t.stripes}</p>
          <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {sessionsAttended} {t.trainings} · {monthsInGrade} {t.months}
          </p>
        </div>
      </div>
    </div>
  )
}
