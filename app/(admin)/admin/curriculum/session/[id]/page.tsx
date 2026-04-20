import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionDetailEditor } from '@/components/admin/SessionDetailEditor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Session bearbeiten | Admin' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const [sessionRes, quizzesRes, tasksRes] = await Promise.all([
    supabase
      .from('curriculum_sessions')
      .select(`
        id, track_id, week_number, session_number, title, theme, objectives,
        warmup, drilling, sparring_focus, homework, duration_minutes,
        curriculum_tracks(id, name, curriculum_id, curricula(id, name))
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('quizzes')
      .select('id, title, description, passing_score, xp_reward, active, quiz_questions(id, question, explanation, quiz_answers(id, answer_text, is_correct, sort_order))')
      .eq('session_id', id)
      .order('created_at'),
    supabase
      .from('learning_tasks')
      .select('id, title, description, task_type, xp_reward, active, sort_order')
      .eq('session_id', id)
      .order('sort_order'),
  ])

  if (!sessionRes.data) notFound()

  const track = Array.isArray(sessionRes.data.curriculum_tracks)
    ? sessionRes.data.curriculum_tracks[0]
    : sessionRes.data.curriculum_tracks
  const curriculum = track && (Array.isArray(track.curricula) ? track.curricula[0] : track.curricula)

  const quizzes = (quizzesRes.data ?? []).map(q => ({
    id:            q.id,
    title:         q.title,
    description:   q.description,
    passing_score: q.passing_score,
    xp_reward:     q.xp_reward,
    active:        q.active,
    questions: (q.quiz_questions ?? []).map(qq => ({
      id:          qq.id,
      question:    qq.question,
      explanation: qq.explanation,
      answers: (qq.quiz_answers ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(a => ({ id: a.id, answer_text: a.answer_text, is_correct: a.is_correct })),
    })),
  }))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        {curriculum && (
          <Link
            href={`/admin/curriculum/${curriculum.id}`}
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            ← {curriculum.name}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-black text-foreground">{sessionRes.data.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {track?.name} · Woche {sessionRes.data.week_number} · Session #{sessionRes.data.session_number}
        </p>
      </div>

      <SessionDetailEditor
        session={{
          id:               sessionRes.data.id,
          title:            sessionRes.data.title,
          theme:            sessionRes.data.theme,
          objectives:       sessionRes.data.objectives,
          warmup:           sessionRes.data.warmup,
          drilling:         sessionRes.data.drilling,
          sparring_focus:   sessionRes.data.sparring_focus,
          homework:         sessionRes.data.homework,
          duration_minutes: sessionRes.data.duration_minutes,
        }}
        quizzes={quizzes}
        tasks={tasksRes.data ?? []}
      />
    </div>
  )
}
