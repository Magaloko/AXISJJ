import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberSessionView } from '@/components/members/MemberSessionView'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Session | AXIS' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function MemberSessionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [sessionRes, quizzesRes, tasksRes, myAttemptsRes, myCompletionsRes] = await Promise.all([
    supabase
      .from('curriculum_sessions')
      .select(`
        id, week_number, session_number, title, theme, objectives,
        warmup, drilling, sparring_focus, homework, duration_minutes,
        curriculum_tracks(name, curriculum_id, curricula(name))
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('quizzes')
      .select('id, title, description, passing_score, xp_reward, active')
      .eq('session_id', id)
      .eq('active', true),
    supabase
      .from('learning_tasks')
      .select('id, title, description, task_type, xp_reward, active')
      .eq('session_id', id)
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('quiz_attempts')
      .select('quiz_id, score, passed')
      .eq('profile_id', user.id),
    supabase
      .from('task_completions')
      .select('task_id')
      .eq('profile_id', user.id),
  ])

  if (!sessionRes.data) notFound()

  const track = Array.isArray(sessionRes.data.curriculum_tracks)
    ? sessionRes.data.curriculum_tracks[0]
    : sessionRes.data.curriculum_tracks
  const curriculum = track && (Array.isArray(track.curricula) ? track.curricula[0] : track.curricula)

  const attemptsByQuiz = new Map<string, { score: number; passed: boolean }>()
  for (const a of myAttemptsRes.data ?? []) {
    const prev = attemptsByQuiz.get(a.quiz_id)
    // Keep best attempt
    if (!prev || a.score > prev.score) attemptsByQuiz.set(a.quiz_id, { score: a.score, passed: a.passed })
  }
  const doneTaskIds = new Set((myCompletionsRes.data ?? []).map(t => t.task_id))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <Link
          href="/mein-training"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Mein Training
        </Link>
        <h1 className="mt-2 text-2xl font-black text-foreground">{sessionRes.data.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {curriculum?.name} · {track?.name} · Woche {sessionRes.data.week_number}, Session #{sessionRes.data.session_number}
        </p>
      </div>

      <MemberSessionView
        session={{
          title:            sessionRes.data.title,
          theme:            sessionRes.data.theme,
          objectives:       sessionRes.data.objectives,
          warmup:           sessionRes.data.warmup,
          drilling:         sessionRes.data.drilling,
          sparring_focus:   sessionRes.data.sparring_focus,
          homework:         sessionRes.data.homework,
          duration_minutes: sessionRes.data.duration_minutes,
        }}
        quizzes={(quizzesRes.data ?? []).map(q => ({
          ...q,
          myBest: attemptsByQuiz.get(q.id) ?? null,
        }))}
        tasks={(tasksRes.data ?? []).map(t => ({
          ...t,
          completed: doneTaskIds.has(t.id),
        }))}
      />
    </div>
  )
}
