// components/members/BeltProgress.tsx

interface Props {
  beltName: string | null
  stripes: number
  colorHex: string | null
  readiness: number
  sessionsAttended: number
  monthsInGrade: number
}

export function BeltProgress({ beltName, stripes, colorHex, readiness, sessionsAttended, monthsInGrade }: Props) {
  if (!beltName) {
    return (
      <div className="border border-white/5 bg-[#111111] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Gürtel</p>
        <p className="mt-4 text-sm text-gray-500">Kein Rang eingetragen — bitte Coach kontaktieren.</p>
      </div>
    )
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const beltColor = colorHex ?? '#e5e7eb'
  const clampedReadiness = Math.min(100, Math.max(0, readiness))
  const offset = circumference - (clampedReadiness / 100) * circumference

  return (
    <div className="border border-white/5 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Gürtel</p>

      <div className="mt-4 flex items-center gap-6">
        {/* SVG progress ring */}
        <svg
          role="img"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-label={`${beltName} Belt, ${stripes} Stripes. Promotionsbereitschaft: ${clampedReadiness}%. ${sessionsAttended} Trainings, ${monthsInGrade} Monate.`}
        >
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
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
          <text x="40" y="45" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
            {clampedReadiness}%
          </text>
        </svg>

        {/* Belt info */}
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 rounded-sm" style={{ backgroundColor: beltColor, border: beltColor === '#111111' ? '1px solid #dc2626' : undefined }} />
          </div>
          <p className="mt-2 text-xl font-black text-white">{beltName} Belt</p>
          <p className="text-xs text-gray-500">{stripes} Stripes</p>
          <p className="mt-2 text-xs text-gray-600">
            {sessionsAttended} Trainings · {monthsInGrade} Monate
          </p>
        </div>
      </div>
    </div>
  )
}
