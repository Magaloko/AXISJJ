// components/members/SkillCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import { updateSkillStatus } from '@/app/actions/skills'

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

const STATUS_LABELS: Record<SkillStatus, string> = {
  not_started: 'Nicht begonnen',
  in_progress: 'In Arbeit',
  mastered: 'Beherrscht',
}

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
}

export function SkillCard({ skill, initialStatus }: Props) {
  const [status, setStatus] = useState<SkillStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()

  const cycle = () => {
    const next = STATUS_NEXT[status]
    setStatus(next)
    startTransition(async () => {
      await updateSkillStatus(skill.id, next)
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
          aria-label={STATUS_LABELS[status]}
          className={cn(
            'px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            status === 'mastered'    && 'bg-green-900/30 text-green-400',
            status === 'in_progress' && 'bg-yellow-900/30 text-yellow-400',
            status === 'not_started' && 'bg-white/5 text-gray-600'
          )}
        >
          {STATUS_LABELS[status]}
        </button>
      </div>
    </div>
  )
}
