// components/members/SkillCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import { updateSkillStatus } from '@/app/actions/skills'
import { translations, type Lang } from '@/lib/i18n'

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

const STATUS_NEXT: Record<SkillStatus, SkillStatus> = {
  not_started: 'in_progress',
  in_progress: 'mastered',
  mastered: 'not_started',
}

interface Skill {
  id: string
  name: string
  description: string | null
  video_url: string | null
}

interface Props {
  skill: Skill
  initialStatus: SkillStatus
  lang?: Lang
}

export function SkillCard({ skill, initialStatus, lang = 'de' }: Props) {
  const [status, setStatus] = useState<SkillStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const t = translations[lang].skillCard

  const statusLabels: Record<SkillStatus, string> = {
    not_started: t.notStarted,
    in_progress: t.inProgress,
    mastered: t.mastered,
  }

  const cycle = () => {
    const prev = status
    const next = STATUS_NEXT[status]
    setStatus(next)
    startTransition(async () => {
      const result = await updateSkillStatus(skill.id, next)
      if (result.error) setStatus(prev)
    })
  }

  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{skill.name}</p>
        {skill.description && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{skill.description}</p>
        )}
      </div>

      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        {skill.video_url && (
          <a
            href={skill.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-white"
            aria-label={`${skill.name} Video`}
          >
            ▶
          </a>
        )}
        <button
          onClick={cycle}
          disabled={isPending}
          aria-label={statusLabels[status]}
          className={cn(
            'px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            status === 'mastered'    && 'bg-green-900/30 text-green-400',
            status === 'in_progress' && 'bg-yellow-900/30 text-yellow-400',
            status === 'not_started' && 'bg-white/5 text-gray-600'
          )}
        >
          {statusLabels[status]}
        </button>
      </div>
    </div>
  )
}
