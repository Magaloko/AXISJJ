// app/(members)/skills/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SkillCard } from '@/components/members/SkillCard'
import { translations } from '@/lib/i18n'
import { resolveLang } from '@/lib/i18n/resolve-lang'
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
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang)
  const t = translations[lang].skills

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
      <h1 className="mb-6 text-2xl font-black text-foreground">{t.title}</h1>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
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
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  {cat.name}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {masteredCount}/{skills.length} {t.mastered}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="border border-border bg-card px-4">
                {skills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    initialStatus={progressMap.get(skill.id) ?? 'not_started'}
                    lang={lang}
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
