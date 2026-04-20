'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { updateSession } from '@/app/actions/curriculum'
import { createQuiz, updateQuiz, deleteQuiz, saveQuestion, deleteQuestion } from '@/app/actions/quizzes'
import { saveLearningTask, deleteLearningTask } from '@/app/actions/learning-tasks'

interface Session {
  id: string
  title: string
  theme: string | null
  objectives: string[]
  warmup: string | null
  drilling: string | null
  sparring_focus: string | null
  homework: string | null
  duration_minutes: number
}

interface Answer {
  id?: string
  answer_text: string
  is_correct: boolean
}

interface Question {
  id: string
  question: string
  explanation: string | null
  answers: Answer[]
}

interface Quiz {
  id: string
  title: string
  description: string | null
  passing_score: number
  xp_reward: number
  active: boolean
  questions: Question[]
}

interface Task {
  id: string
  title: string
  description: string | null
  task_type: 'reflection' | 'drill' | 'journal' | 'video' | 'reading'
  xp_reward: number
  active: boolean
  sort_order: number
}

interface Props {
  session: Session
  quizzes: Quiz[]
  tasks: Task[]
}

const INPUT_CLS = 'w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary'
const LABEL_CLS = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'

export function SessionDetailEditor({ session, quizzes, tasks }: Props) {
  return (
    <div className="space-y-8">
      <SessionFields session={session} />
      <QuizzesSection sessionId={session.id} quizzes={quizzes} />
      <TasksSection sessionId={session.id} tasks={tasks} />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// Session Fields
// ───────────────────────────────────────────────────────────────
function SessionFields({ session }: { session: Session }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [title, setTitle] = useState(session.title)
  const [theme, setTheme] = useState(session.theme ?? '')
  const [objectives, setObjectives] = useState(session.objectives.join('\n'))
  const [warmup, setWarmup] = useState(session.warmup ?? '')
  const [drilling, setDrilling] = useState(session.drilling ?? '')
  const [sparringFocus, setSparringFocus] = useState(session.sparring_focus ?? '')
  const [homework, setHomework] = useState(session.homework ?? '')
  const [duration, setDuration] = useState(session.duration_minutes)

  function onSave() {
    setMessage(null)
    startTransition(async () => {
      const r = await updateSession({
        id:               session.id,
        title:            title.trim(),
        theme:            theme.trim() || null,
        objectives:       objectives.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10),
        warmup:           warmup.trim() || null,
        drilling:         drilling.trim() || null,
        sparring_focus:   sparringFocus.trim() || null,
        homework:         homework.trim() || null,
        duration_minutes: duration,
      })
      if (r.error) setMessage({ type: 'err', text: r.error })
      else {
        setMessage({ type: 'ok', text: '✓ Gespeichert' })
        router.refresh()
      }
    })
  }

  return (
    <section className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Session-Inhalt</p>

      <div className="space-y-4">
        <div>
          <label className={LABEL_CLS}>Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Thema</label>
          <input value={theme} onChange={e => setTheme(e.target.value)} maxLength={200} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Lernziele (eine Zeile pro Ziel, max 10)</label>
          <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={4} className={`${INPUT_CLS} resize-y font-mono`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLS}>Warmup</label>
            <textarea value={warmup} onChange={e => setWarmup(e.target.value)} rows={3} maxLength={2000} className={`${INPUT_CLS} resize-y`} />
          </div>
          <div>
            <label className={LABEL_CLS}>Drilling</label>
            <textarea value={drilling} onChange={e => setDrilling(e.target.value)} rows={3} maxLength={2000} className={`${INPUT_CLS} resize-y`} />
          </div>
          <div>
            <label className={LABEL_CLS}>Sparring Focus</label>
            <textarea value={sparringFocus} onChange={e => setSparringFocus(e.target.value)} rows={3} maxLength={2000} className={`${INPUT_CLS} resize-y`} />
          </div>
          <div>
            <label className={LABEL_CLS}>Homework</label>
            <textarea value={homework} onChange={e => setHomework(e.target.value)} rows={3} maxLength={2000} className={`${INPUT_CLS} resize-y`} />
          </div>
        </div>

        <div className="max-w-[180px]">
          <label className={LABEL_CLS}>Dauer (Minuten)</label>
          <input type="number" min={10} max={240} value={duration} onChange={e => setDuration(Number(e.target.value))} className={INPUT_CLS} />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={onSave} disabled={isPending || title.trim().length < 2} className="bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
        {message && (
          <p className={`text-sm ${message.type === 'err' ? 'text-destructive' : 'text-primary'}`}>{message.text}</p>
        )}
      </div>
    </section>
  )
}

// ───────────────────────────────────────────────────────────────
// Quizzes
// ───────────────────────────────────────────────────────────────
function QuizzesSection({ sessionId, quizzes }: { sessionId: string; quizzes: Quiz[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onAddQuiz(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await createQuiz({
        session_id:    sessionId,
        title:         newTitle.trim(),
        passing_score: 70,
        xp_reward:     10,
      })
      if (r.error) setError(r.error)
      else {
        setNewTitle('')
        setShowAdd(false)
        router.refresh()
      }
    })
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Quizzes ({quizzes.length})
        </p>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline">
            <Plus size={14} /> Quiz
          </button>
        )}
      </div>

      <div className="space-y-4">
        {quizzes.map(quiz => (
          <QuizBlock key={quiz.id} quiz={quiz} />
        ))}

        {showAdd && (
          <form onSubmit={onAddQuiz} className="border border-border bg-card p-4">
            <label className={LABEL_CLS}>Quiz-Titel</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="z.B. Quiz zur Session" className={INPUT_CLS} required minLength={2} maxLength={120} />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-3 flex items-center gap-3">
              <button type="submit" disabled={isPending || newTitle.trim().length < 2} className="bg-primary px-4 py-1.5 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50">
                Anlegen
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setError(null) }} className="text-xs text-muted-foreground hover:text-foreground">
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {quizzes.length === 0 && !showAdd && (
          <div className="border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Noch kein Quiz — starte mit einer einfachen 5-Fragen-MC für diese Session.
          </div>
        )}
      </div>
    </section>
  )
}

function QuizBlock({ quiz }: { quiz: Quiz }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(quiz.title)
  const [description, setDescription] = useState(quiz.description ?? '')
  const [passingScore, setPassingScore] = useState(quiz.passing_score)
  const [xpReward, setXpReward] = useState(quiz.xp_reward)
  const [active, setActive] = useState(quiz.active)
  const [editingQuestionId, setEditingQuestionId] = useState<string | 'new' | null>(null)

  function onSaveMeta() {
    startTransition(async () => {
      const r = await updateQuiz({
        id:            quiz.id,
        title:         title.trim(),
        description:   description.trim() || null,
        passing_score: passingScore,
        xp_reward:     xpReward,
        active,
      })
      if (!r.error) router.refresh()
    })
  }

  function onDelete() {
    if (!confirm(`Quiz "${quiz.title}" löschen? Alle Fragen werden entfernt.`)) return
    startTransition(async () => {
      const r = await deleteQuiz(quiz.id)
      if (!r.error) router.refresh()
    })
  }

  function onDeleteQuestion(questionId: string) {
    if (!confirm('Frage löschen?')) return
    startTransition(async () => {
      const r = await deleteQuestion(questionId)
      if (!r.error) router.refresh()
    })
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <p className="font-bold text-foreground">{quiz.title}</p>
          <p className="text-xs text-muted-foreground">
            {quiz.questions.length} Fragen · {quiz.passing_score}% pass · {quiz.xp_reward} XP{!quiz.active && ' · Inaktiv'}
          </p>
        </div>
        <button onClick={onDelete} disabled={isPending} aria-label="Quiz löschen" className="text-muted-foreground hover:text-destructive disabled:opacity-50">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <label className={LABEL_CLS}>Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Pass %</label>
            <input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>XP</label>
            <input type="number" min={0} max={100} value={xpReward} onChange={e => setXpReward(Number(e.target.value))} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Status</label>
            <label className="flex h-[38px] items-center gap-2 border border-border bg-background px-3 text-sm">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
              {active ? 'Aktiv' : 'Inaktiv'}
            </label>
          </div>
        </div>
        <div className="mb-6">
          <label className={LABEL_CLS}>Beschreibung</label>
          <input value={description} onChange={e => setDescription(e.target.value)} className={INPUT_CLS} maxLength={500} />
          <button onClick={onSaveMeta} disabled={isPending} className="mt-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline disabled:opacity-50">
            Metadaten speichern
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fragen</p>

          {quiz.questions.map((q, i) =>
            editingQuestionId === q.id ? (
              <QuestionEditor key={q.id} quizId={quiz.id} question={q} onDone={() => setEditingQuestionId(null)} />
            ) : (
              <div key={q.id} className="border border-border/50 bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      <span className="mr-2 text-xs text-muted-foreground">#{i + 1}</span>
                      {q.question}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {q.answers.map(a => (
                        <li key={a.id} className="flex items-center gap-2 text-xs">
                          {a.is_correct ? <Check size={12} className="text-primary" /> : <X size={12} className="text-muted-foreground/50" />}
                          <span className={a.is_correct ? 'text-foreground' : 'text-muted-foreground'}>{a.answer_text}</span>
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => setEditingQuestionId(q.id)} className="text-xs font-bold uppercase text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => onDeleteQuestion(q.id)} disabled={isPending} aria-label="Frage löschen" className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {editingQuestionId === 'new' ? (
            <QuestionEditor quizId={quiz.id} onDone={() => setEditingQuestionId(null)} />
          ) : (
            <button onClick={() => setEditingQuestionId('new')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline">
              <Plus size={14} /> Frage hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// Question Editor (inline form)
// ───────────────────────────────────────────────────────────────
function QuestionEditor({
  quizId,
  question,
  onDone,
}: {
  quizId: string
  question?: Question
  onDone: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(question?.question ?? '')
  const [explanation, setExplanation] = useState(question?.explanation ?? '')
  const [answers, setAnswers] = useState<Answer[]>(
    question?.answers && question.answers.length >= 2
      ? question.answers
      : [
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
        ]
  )
  const [error, setError] = useState<string | null>(null)

  function setAnswer(i: number, patch: Partial<Answer>) {
    setAnswers(prev => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a))
  }

  function addAnswer() {
    if (answers.length >= 6) return
    setAnswers(prev => [...prev, { answer_text: '', is_correct: false }])
  }

  function removeAnswer(i: number) {
    if (answers.length <= 2) return
    setAnswers(prev => prev.filter((_, idx) => idx !== i))
  }

  function onSave() {
    setError(null)
    const cleaned = answers
      .map(a => ({ ...a, answer_text: a.answer_text.trim() }))
      .filter(a => a.answer_text.length > 0)

    if (cleaned.length < 2) { setError('Mindestens 2 Antworten.'); return }
    if (!cleaned.some(a => a.is_correct)) { setError('Mindestens eine korrekte Antwort markieren.'); return }

    startTransition(async () => {
      const r = await saveQuestion({
        id:          question?.id,
        quiz_id:     quizId,
        question:    text.trim(),
        explanation: explanation.trim() || undefined,
        answers:     cleaned,
      })
      if (r.error) setError(r.error)
      else {
        onDone()
        router.refresh()
      }
    })
  }

  return (
    <div className="border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3">
        <label className={LABEL_CLS}>Frage *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={500} className={`${INPUT_CLS} resize-y`} />
      </div>

      <div className="mb-3">
        <label className={LABEL_CLS}>Antworten (markiere korrekte)</label>
        <div className="space-y-2">
          {answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={a.is_correct}
                onChange={e => setAnswer(i, { is_correct: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <input
                value={a.answer_text}
                onChange={e => setAnswer(i, { answer_text: e.target.value })}
                maxLength={200}
                placeholder={`Antwort ${i + 1}`}
                className={`${INPUT_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeAnswer(i)}
                disabled={answers.length <= 2}
                aria-label="Antwort entfernen"
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {answers.length < 6 && (
            <button type="button" onClick={addAnswer} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Antwort
            </button>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className={LABEL_CLS}>Erklärung (nach Antwort)</label>
        <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} maxLength={1000} className={`${INPUT_CLS} resize-y`} />
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={isPending || text.trim().length < 2} className="bg-primary px-4 py-1.5 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50">
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
        <button onClick={onDone} type="button" className="text-xs text-muted-foreground hover:text-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// Tasks
// ───────────────────────────────────────────────────────────────
const TASK_TYPES: { value: Task['task_type']; label: string }[] = [
  { value: 'reflection', label: 'Reflexion' },
  { value: 'drill',      label: 'Drill' },
  { value: 'journal',    label: 'Journal' },
  { value: 'video',      label: 'Video' },
  { value: 'reading',    label: 'Lesen' },
]

function TasksSection({ sessionId, tasks }: { sessionId: string; tasks: Task[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)

  function onDelete(id: string) {
    if (!confirm('Task löschen?')) return
    startTransition(async () => {
      const r = await deleteLearningTask(id)
      if (!r.error) router.refresh()
    })
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Lernaufgaben ({tasks.length})
        </p>
        {editingId === null && (
          <button onClick={() => setEditingId('new')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline">
            <Plus size={14} /> Task
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.map(task =>
          editingId === task.id ? (
            <TaskEditor key={task.id} sessionId={sessionId} task={task} onDone={() => setEditingId(null)} />
          ) : (
            <div key={task.id} className="border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    <span className="mr-2 inline-block bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {TASK_TYPES.find(t => t.value === task.task_type)?.label ?? task.task_type}
                    </span>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                  )}
                  <p className="mt-1 text-[10px] font-bold uppercase text-primary">{task.xp_reward} XP</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => setEditingId(task.id)} className="text-xs font-bold uppercase text-primary hover:underline">
                    Edit
                  </button>
                  <button onClick={() => onDelete(task.id)} disabled={isPending} aria-label="Task löschen" className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {editingId === 'new' && (
          <TaskEditor sessionId={sessionId} onDone={() => setEditingId(null)} />
        )}

        {tasks.length === 0 && editingId !== 'new' && (
          <div className="border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Noch keine Lernaufgaben — typisch: 1 Reflection + 1 Drill pro Session.
          </div>
        )}
      </div>
    </section>
  )
}

function TaskEditor({ sessionId, task, onDone }: { sessionId: string; task?: Task; onDone: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [taskType, setTaskType] = useState<Task['task_type']>(task?.task_type ?? 'reflection')
  const [xpReward, setXpReward] = useState(task?.xp_reward ?? 5)
  const [error, setError] = useState<string | null>(null)

  function onSave() {
    setError(null)
    startTransition(async () => {
      const r = await saveLearningTask({
        id:          task?.id,
        session_id:  sessionId,
        title:       title.trim(),
        description: description.trim() || undefined,
        task_type:   taskType,
        xp_reward:   xpReward,
      })
      if (r.error) setError(r.error)
      else {
        onDone()
        router.refresh()
      }
    })
  }

  return (
    <div className="border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <div>
          <label className={LABEL_CLS}>Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Typ</label>
          <select value={taskType} onChange={e => setTaskType(e.target.value as Task['task_type'])} className={INPUT_CLS}>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>XP</label>
          <input type="number" min={0} max={100} value={xpReward} onChange={e => setXpReward(Number(e.target.value))} className={`${INPUT_CLS} w-20`} />
        </div>
      </div>
      <div className="mb-3">
        <label className={LABEL_CLS}>Beschreibung</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={2000} className={`${INPUT_CLS} resize-y`} />
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={isPending || title.trim().length < 2} className="bg-primary px-4 py-1.5 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50">
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
        <button onClick={onDone} type="button" className="text-xs text-muted-foreground hover:text-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  )
}
