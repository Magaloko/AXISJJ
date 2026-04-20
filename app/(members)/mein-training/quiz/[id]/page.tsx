import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuizPlayer } from '@/components/members/QuizPlayer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quiz | AXIS' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function MemberQuizPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select(`
      id, title, description, passing_score, xp_reward, active, session_id,
      quiz_questions(id, question, explanation, sort_order,
        quiz_answers(id, answer_text, sort_order))
    `)
    .eq('id', id)
    .maybeSingle()

  if (!quiz || !quiz.active) notFound()

  const questions = (quiz.quiz_questions ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(q => ({
      id:          q.id,
      question:    q.question,
      explanation: q.explanation,
      answers: (q.quiz_answers ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(a => ({ id: a.id, answer_text: a.answer_text })),
    }))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <Link
          href={quiz.session_id ? `/mein-training/session/${quiz.session_id}` : '/mein-training'}
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Zurück
        </Link>
        <h1 className="mt-2 text-2xl font-black text-foreground">{quiz.title}</h1>
        {quiz.description && <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          {questions.length} Fragen · {quiz.passing_score}% zum Bestehen · {quiz.xp_reward} XP
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Dieses Quiz hat noch keine Fragen.
        </div>
      ) : (
        <QuizPlayer quizId={quiz.id} questions={questions} />
      )}
    </div>
  )
}
