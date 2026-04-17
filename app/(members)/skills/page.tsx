// app/(members)/skills/page.tsx
import { createClient } from '@/lib/supabase/server'
import { SkillCard } from '@/components/members/SkillCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Skills' }

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

interface SkillRow {
  id: string
  name: string
  description: string | null
  video_url: string | null
}

interface CategoryRow {
  id: string
  name: string
  order: number
  skills: SkillRow[] | SkillRow | null
}

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const userId = user.id

  const [{ data: rawCategories }, { data: progressRows }] = await Promise.all([
    supabase
      .from('skill_categories')
      .select('id, name, order, skills(id, name, description, video_url)')
      .order('order'),
    supabase
      .from('skill_progress')
      .select('skill_id, status')
      .eq('profile_id', userId),
  ])

  const progressMap = new Map<string, SkillStatus>(
    progressRows?.map(p => [p.skill_id, p.status as SkillStatus]) ?? []
  )

  const categories = (rawCategories ?? []) as CategoryRow[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-black text-white">Skills</h1>

      {categories.length === 0 && (
        <p className="text-sm text-gray-500">Noch keine Skills eingetragen.</p>
      )}

      <div className="space-y-8">
        {categories.map(cat => {
          const rawSkills = cat.skills
          const skills: SkillRow[] = Array.isArray(rawSkills)
            ? rawSkills
            : rawSkills
            ? [rawSkills]
            : []

          if (skills.length === 0) return null

          const masteredCount = skills.filter(s => progressMap.get(s.id) === 'mastered').length

          return (
            <div key={cat.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {cat.name}
                </h2>
                <span className="text-xs text-gray-600">
                  {masteredCount}/{skills.length} beherrscht
                </span>
                <span className="h-px flex-1 bg-white/5" />
              </div>

              <div className="border border-white/5 bg-[#111111] px-4">
                {skills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    initialStatus={progressMap.get(skill.id) ?? 'not_started'}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
