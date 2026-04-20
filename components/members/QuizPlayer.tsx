'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Check, X, Trophy } from 'lucide-react'
import { submitQuizAttempt } from '@/app/actions/quizzes'

interface Question {
  id: string
  question: string
  explanation: string | null
  answers: { id: string; answer_text: string }[]
}

interface Props {
  quizId: string
  questions: Question[]
}

interface Result {
  score: number
  passed: boolean
  xpEarned: number
  newBadges: string[]
}

export function QuizPlayer({ quizId, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function pickAnswer(questionId: string, answerId: string) {
    if (result) return
    setAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }

  const allAnswered = questions.every(q => answers[q.id] != null)

  function onSubmit() {
    setError(null)
    startTransition(async () => {
      const r = await submitQuizAttempt({ quiz_id: quizId, answers })
      if (r.error) {
        setError(r.error)
      } else if (r.score != null && r.passed != null) {
        setResult({
          score:     r.score,
          passed:    r.passed,
          xpEarned:  r.xpEarned ?? 0,
          newBadges: r.newBadges ?? [],
        })
      }
    })
  }

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className={
          result.passed
            ? 'border border-primary bg-primary/5 p-8 text-center'
            : 'border border-border bg-card p-8 text-center'
        }>
          <Trophy size={40} className={result.passed ? 'mx-auto text-primary' : 'mx-auto text-muted-foreground'} />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {result.passed ? 'Bestanden' : 'Nochmal'}
          </p>
          <p className="mt-1 text-4xl font-black text-foreground">{result.score}%</p>
          {result.xpEarned > 0 && (
            <p className="mt-3 text-sm font-bold text-primary">+{result.xpEarned} XP</p>
          )}
          {result.newBadges.length > 0 && (
            <p className="mt-2 text-sm text-primary">
              🎉 {result.newBadges.length} neue{result.newBadges.length === 1 ? 's' : ''} Badge freigeschaltet!
            </p>
          )}
        </div>

        {/* Show correct answers */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Auflösung</p>
          {questions.map((q, i) => (
            <QuestionReview key={q.id} idx={i + 1} question={q} mySelectedId={answers[q.id]} />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => { setResult(null); setAnswers({}) }}
            className="bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            Nochmal
          </button>
          <Link
            href="/mein-training"
            className="inline-flex items-center border border-border px-5 py-2 text-sm font-bold uppercase tracking-wider text-foreground hover:bg-muted"
          >
            Training
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">
            <span className="mr-2 font-mono text-xs text-muted-foreground">#{i + 1}</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {q.answers.map(a => {
              const selected = answers[q.id] === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => pickAnswer(q.id, a.id)}
                  className={
                    selected
                      ? 'block w-full border-2 border-primary bg-primary/10 px-4 py-3 text-left text-sm font-semibold text-foreground'
                      : 'block w-full border border-border bg-background px-4 py-3 text-left text-sm text-foreground hover:border-primary'
                  }
                >
                  {a.answer_text}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={isPending || !allAnswered}
        className="bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Wird gewertet…' : allAnswered ? 'Abgeben' : `Noch ${questions.length - Object.keys(answers).length} Fragen`}
      </button>
    </div>
  )
}

function QuestionReview({ idx, question, mySelectedId }: { idx: number; question: Question; mySelectedId?: string }) {
  // We don't have `is_correct` client-side (to prevent cheating). Instead show
  // the member's selected answer and the explanation — the server has graded.
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">
        <span className="mr-2 font-mono text-xs text-muted-foreground">#{idx}</span>
        {question.question}
      </p>
      <ul className="mt-2 space-y-1">
        {question.answers.map(a => {
          const mine = a.id === mySelectedId
          return (
            <li key={a.id} className={mine ? 'flex items-center gap-2 text-sm font-semibold text-foreground' : 'flex items-center gap-2 text-sm text-muted-foreground'}>
              {mine ? <Check size={12} className="text-primary" /> : <X size={12} className="text-muted-foreground/30" />}
              {a.answer_text}
            </li>
          )
        })}
      </ul>
      {question.explanation && (
        <p className="mt-2 border-l-2 border-primary/40 pl-3 text-xs italic text-muted-foreground">
          {question.explanation}
        </p>
      )}
    </div>
  )
}
