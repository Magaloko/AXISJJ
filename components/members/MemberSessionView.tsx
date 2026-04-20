'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Play } from 'lucide-react'
import { completeTask } from '@/app/actions/learning-tasks'

interface Session {
  title: string
  theme: string | null
  objectives: string[]
  warmup: string | null
  drilling: string | null
  sparring_focus: string | null
  homework: string | null
  duration_minutes: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  passing_score: number
  xp_reward: number
  myBest: { score: number; passed: boolean } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  task_type: 'reflection' | 'drill' | 'journal' | 'video' | 'reading'
  xp_reward: number
  completed: boolean
}

const TYPE_LABEL: Record<Task['task_type'], string> = {
  reflection: 'Reflexion',
  drill:      'Drill',
  journal:    'Journal',
  video:      'Video',
  reading:    'Lesen',
}

export function MemberSessionView({ session, quizzes, tasks }: {
  session: Session
  quizzes: Quiz[]
  tasks: Task[]
}) {
  return (
    <div className="space-y-6">
      {/* Content */}
      <section className="space-y-5 border border-border bg-card p-6">
        {session.theme && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Thema</p>
            <p className="text-foreground">{session.theme}</p>
          </div>
        )}

        {session.objectives.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Lernziele</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {session.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {session.warmup && <Block label="Warmup" text={session.warmup} />}
          {session.drilling && <Block label="Drilling" text={session.drilling} />}
          {session.sparring_focus && <Block label="Sparring" text={session.sparring_focus} />}
          {session.homework && <Block label="Homework" text={session.homework} />}
        </div>

        <p className="text-xs text-muted-foreground">Dauer: {session.duration_minutes} Min.</p>
      </section>

      {/* Quizzes */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Quizzes ({quizzes.length})
        </p>
        {quizzes.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
            Kein Quiz für diese Session.
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map(q => (
              <Link key={q.id} href={`/mein-training/quiz/${q.id}`}
                className="flex items-center justify-between gap-3 border border-border bg-card p-4 hover:border-primary">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{q.title}</p>
                  {q.description && <p className="mt-0.5 text-xs text-muted-foreground">{q.description}</p>}
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {q.xp_reward} XP · {q.passing_score}% zum Bestehen
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {q.myBest && (
                    <span className={
                      q.myBest.passed
                        ? 'inline-flex items-center gap-1 bg-primary/10 px-2 py-1 text-xs font-bold text-primary'
                        : 'inline-flex items-center gap-1 bg-muted px-2 py-1 text-xs font-bold text-muted-foreground'
                    }>
                      {q.myBest.passed ? <Check size={12} /> : null}
                      {q.myBest.score}%
                    </span>
                  )}
                  <Play size={16} className="text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Lernaufgaben ({tasks.length})
        </p>
        {tasks.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
            Keine Aufgaben für diese Session.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(task.completed)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  function onComplete() {
    startTransition(async () => {
      const r = await completeTask(task.id, notes)
      if (r.error) {
        setFeedback(r.error)
      } else {
        setDone(true)
        if (r.xpEarned && r.xpEarned > 0) {
          setFeedback(`✓ +${r.xpEarned} XP${r.newBadges?.length ? ` · ${r.newBadges.length} Badge!` : ''}`)
        } else {
          setFeedback('✓ Bereits erledigt')
        }
        router.refresh()
      }
    })
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            <span className="mr-2 inline-block bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[task.task_type]}
            </span>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
          )}
          <p className="mt-1 text-[10px] font-bold uppercase text-primary">{task.xp_reward} XP</p>
        </div>

        {done ? (
          <span className="inline-flex items-center gap-1 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase text-primary">
            <Check size={14} /> Erledigt
          </span>
        ) : showNotes ? null : (
          <button
            onClick={() => setShowNotes(true)}
            className="bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            Erledigt
          </button>
        )}
      </div>

      {showNotes && !done && (
        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notizen (optional)"
            rows={2}
            className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={onComplete}
              disabled={isPending}
              className="bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50"
            >
              {isPending ? '…' : 'Abschließen + XP'}
            </button>
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className="mt-2 text-xs font-semibold text-primary">{feedback}</p>
      )}
    </div>
  )
}
