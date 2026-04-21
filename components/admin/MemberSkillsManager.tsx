'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateMemberSkillStatus } from '@/app/actions/skills'
import { Check, Circle } from 'lucide-react'

type Status = 'not_started' | 'in_progress' | 'mastered'

const NEXT: Record<Status, Status> = {
  not_started: 'in_progress',
  in_progress: 'mastered',
  mastered: 'not_started',
}

function StatusLabel({ status }: { status: Status }) {
  if (status === 'not_started') return <span>—</span>
  if (status === 'in_progress') {
    return (
      <span className="flex items-center gap-1">
        <Circle size={10} strokeWidth={3} fill="currentColor" />
        WIP
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <Check size={12} strokeWidth={3} />
      Ok
    </span>
  )
}

const COLOR: Record<Status, string> = {
  not_started: 'border-border bg-muted text-muted-foreground',
  in_progress: 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300',
  mastered: 'border-primary bg-primary/10 text-primary',
}

interface Skill {
  id: string
  name: string
  description: string | null
  category_name: string
  status: Status
}

interface Props { profileId: string }

export function MemberSkillsManager({ profileId }: Props) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    Promise.all([
      supabase.from('skills').select('id, name, description, category_id, "order", skill_categories(name, "order")').order('order', { ascending: true }),
      supabase.from('skill_progress').select('skill_id, status').eq('profile_id', profileId),
    ]).then(([skillsRes, progressRes]) => {
      if (cancelled) return
      const statusMap = new Map<string, Status>()
      for (const p of progressRes.data ?? []) {
        statusMap.set(p.skill_id, p.status)
      }
      const rows: Skill[] = (skillsRes.data ?? []).map(s => {
        const cat = Array.isArray(s.skill_categories) ? s.skill_categories[0] : s.skill_categories
        return {
          id: s.id,
          name: s.name,
          description: s.description,
          category_name: cat?.name ?? 'Allgemein',
          status: statusMap.get(s.id) ?? 'not_started',
        }
      })
      setSkills(rows)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [profileId])

  function cycle(skill: Skill) {
    const next = NEXT[skill.status]
    setPendingId(skill.id)
    startTransition(async () => {
      const result = await updateMemberSkillStatus(profileId, skill.id, next)
      if (!result.error) {
        setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, status: next } : s))
      }
      setPendingId(null)
    })
  }

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    if (!acc[s.category_name]) acc[s.category_name] = []
    acc[s.category_name].push(s)
    return acc
  }, {})

  const mastered = skills.filter(s => s.status === 'mastered').length
  const wip = skills.filter(s => s.status === 'in_progress').length

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Technik-Bibliothek
        </p>
        {!loading && skills.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            <span className="text-primary font-bold">{mastered}</span> / {skills.length} gemeistert · {wip} WIP
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Lade Techniken...</p>
      ) : skills.length === 0 ? (
        <p className="text-xs text-muted-foreground">Keine Techniken hinterlegt.</p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {category}
              </p>
              <div className="space-y-1">
                {items.map(s => (
                  <button
                    key={s.id}
                    onClick={() => cycle(s)}
                    disabled={isPending && pendingId === s.id}
                    className={`flex w-full items-center justify-between border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${COLOR[s.status]}`}
                  >
                    <span className="font-semibold text-left">{s.name}</span>
                    <span className="ml-3 font-bold"><StatusLabel status={s.status} /></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
