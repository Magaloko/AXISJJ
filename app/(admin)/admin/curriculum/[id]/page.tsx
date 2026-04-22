import { isOwnerLevel } from '@/lib/auth/roles'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CurriculumEditor } from '@/components/admin/CurriculumEditor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lehrplan bearbeiten | Admin' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CurriculumEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const [curriculumRes, tracksRes, classTypesRes] = await Promise.all([
    supabase
      .from('curricula')
      .select('id, name, description, duration_weeks, age_group, active')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('curriculum_tracks')
      .select('id, class_type_id, name, sessions_per_week, sort_order, class_types(name)')
      .eq('curriculum_id', id)
      .order('sort_order'),
    supabase
      .from('class_types')
      .select('id, name, level, gi')
      .order('name'),
  ])

  if (!curriculumRes.data) notFound()

  const trackIds = (tracksRes.data ?? []).map(t => t.id)
  const { data: sessions } = trackIds.length > 0
    ? await supabase
        .from('curriculum_sessions')
        .select('id, track_id, week_number, session_number, title, theme, duration_minutes')
        .in('track_id', trackIds)
        .order('week_number')
        .order('session_number')
    : { data: [] }

  const tracks = (tracksRes.data ?? []).map(t => {
    const ct = Array.isArray(t.class_types) ? t.class_types[0] : t.class_types
    return {
      id:                t.id,
      class_type_id:     t.class_type_id,
      name:              t.name,
      sessions_per_week: t.sessions_per_week,
      class_type_name:   ct?.name ?? 'Unbekannt',
      sessions: (sessions ?? []).filter(s => s.track_id === t.id).map(s => ({
        id:               s.id,
        week_number:      s.week_number,
        session_number:   s.session_number,
        title:            s.title,
        theme:            s.theme,
        duration_minutes: s.duration_minutes,
      })),
    }
  })

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <Link
          href="/admin/curriculum"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Alle Lehrpläne
        </Link>
        <h1 className="mt-2 text-2xl font-black text-foreground">{curriculumRes.data.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {curriculumRes.data.duration_weeks} {curriculumRes.data.duration_weeks === 1 ? 'Woche' : 'Wochen'} ·{' '}
          {curriculumRes.data.age_group === 'kids' ? 'Kinder' : 'Erwachsene'}
          {!curriculumRes.data.active && ' · Inaktiv'}
        </p>
      </div>

      <CurriculumEditor
        curriculum={curriculumRes.data}
        tracks={tracks}
        classTypes={classTypesRes.data ?? []}
      />
    </div>
  )
}
