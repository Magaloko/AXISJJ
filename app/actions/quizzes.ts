'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { awardXp, checkAndGrantBadges } from '@/lib/gamification'

// ─── Quiz ─────────────────────────────────────────────────────

const createQuizSchema = z.object({
  session_id:    z.string().uuid().nullable(),
  title:         z.string().min(2).max(120),
  description:   z.string().max(500).optional(),
  passing_score: z.number().int().min(0).max(100).default(70),
  xp_reward:     z.number().int().min(0).max(100).default(10),
})

export async function createQuiz(
  data: z.infer<typeof createQuizSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = createQuizSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('quizzes')
    .insert({
      session_id:    parsed.data.session_id,
      title:         parsed.data.title,
      description:   parsed.data.description ?? null,
      passing_score: parsed.data.passing_score,
      xp_reward:     parsed.data.xp_reward,
    })
    .select('id')
    .single()

  if (error || !row) return { error: `Anlegen fehlgeschlagen: ${error?.message ?? '?'}` }

  if (parsed.data.session_id) revalidatePath(`/admin/curriculum/session/${parsed.data.session_id}`)
  return { id: row.id }
}

const updateQuizSchema = z.object({
  id:            z.string().uuid(),
  title:         z.string().min(2).max(120),
  description:   z.string().max(500).nullable(),
  passing_score: z.number().int().min(0).max(100),
  xp_reward:     z.number().int().min(0).max(100),
  active:        z.boolean(),
})

export async function updateQuiz(
  data: z.infer<typeof updateQuizSchema>,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateQuizSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: q } = await supabase.from('quizzes').select('session_id').eq('id', parsed.data.id).single()

  const { error } = await supabase
    .from('quizzes')
    .update({
      title:         parsed.data.title,
      description:   parsed.data.description,
      passing_score: parsed.data.passing_score,
      xp_reward:     parsed.data.xp_reward,
      active:        parsed.data.active,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }

  if (q?.session_id) revalidatePath(`/admin/curriculum/session/${q.session_id}`)
  return { success: true }
}

export async function deleteQuiz(quizId: string): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: q } = await supabase.from('quizzes').select('session_id').eq('id', quizId).single()
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  if (q?.session_id) revalidatePath(`/admin/curriculum/session/${q.session_id}`)
  return { success: true }
}

// ─── Question + Answers ──────────────────────────────────────

const saveQuestionSchema = z.object({
  id:          z.string().uuid().optional(),
  quiz_id:     z.string().uuid(),
  question:    z.string().min(2).max(500),
  explanation: z.string().max(1000).optional(),
  answers: z.array(z.object({
    id:          z.string().uuid().optional(),
    answer_text: z.string().min(1).max(200),
    is_correct:  z.boolean(),
  })).min(2).max(6),
})

export async function saveQuestion(
  data: z.infer<typeof saveQuestionSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = saveQuestionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const correctCount = parsed.data.answers.filter(a => a.is_correct).length
  if (correctCount < 1) return { error: 'Mindestens eine Antwort muss korrekt sein.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  let questionId = parsed.data.id

  if (questionId) {
    // Update existing
    const { error } = await supabase
      .from('quiz_questions')
      .update({
        question:    parsed.data.question,
        explanation: parsed.data.explanation ?? null,
      })
      .eq('id', questionId)
    if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }
    // Simplest sync: replace answers
    await supabase.from('quiz_answers').delete().eq('question_id', questionId)
  } else {
    // New — append to end
    const { count } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', parsed.data.quiz_id)

    const { data: qRow, error } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id:     parsed.data.quiz_id,
        question:    parsed.data.question,
        explanation: parsed.data.explanation ?? null,
        sort_order:  count ?? 0,
      })
      .select('id')
      .single()
    if (error || !qRow) return { error: `Anlegen fehlgeschlagen: ${error?.message ?? '?'}` }
    questionId = qRow.id
  }

  // Insert answers
  const answerRows = parsed.data.answers.map((a, i) => ({
    question_id: questionId!,
    answer_text: a.answer_text,
    is_correct:  a.is_correct,
    sort_order:  i,
  }))
  const { error: ansErr } = await supabase.from('quiz_answers').insert(answerRows)
  if (ansErr) return { error: `Antworten speichern fehlgeschlagen: ${ansErr.message}` }

  // Revalidate parent session page
  const { data: quiz } = await supabase.from('quizzes').select('session_id').eq('id', parsed.data.quiz_id).single()
  if (quiz?.session_id) revalidatePath(`/admin/curriculum/session/${quiz.session_id}`)

  return { id: questionId }
}

export async function deleteQuestion(questionId: string): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  // Find parent session for revalidation
  const { data: q } = await supabase.from('quiz_questions').select('quiz_id').eq('id', questionId).single()
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  if (q?.quiz_id) {
    const { data: quiz } = await supabase.from('quizzes').select('session_id').eq('id', q.quiz_id).single()
    if (quiz?.session_id) revalidatePath(`/admin/curriculum/session/${quiz.session_id}`)
  }
  return { success: true }
}

// ─── Member: submit attempt ─────────────────────────────────

const submitAttemptSchema = z.object({
  quiz_id: z.string().uuid(),
  // answers: map of question_id → selected answer_id(s)
  answers: z.record(z.string().uuid(), z.union([z.string().uuid(), z.array(z.string().uuid())])),
})

export async function submitQuizAttempt(
  data: z.infer<typeof submitAttemptSchema>,
): Promise<{ score?: number; passed?: boolean; xpEarned?: number; newBadges?: string[]; error?: string }> {
  const parsed = submitAttemptSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('passing_score, active, xp_reward')
    .eq('id', parsed.data.quiz_id)
    .single()
  if (!quiz || !quiz.active) return { error: 'Quiz nicht aktiv.' }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, quiz_answers(id, is_correct)')
    .eq('quiz_id', parsed.data.quiz_id)

  if (!questions || questions.length === 0) return { error: 'Quiz hat keine Fragen.' }

  let correct = 0
  for (const q of questions) {
    const selected = parsed.data.answers[q.id]
    if (!selected) continue
    const selectedIds = Array.isArray(selected) ? selected : [selected]
    const correctIds = (q.quiz_answers ?? []).filter(a => a.is_correct).map(a => a.id).sort()
    const selSorted  = [...selectedIds].sort()
    const match = correctIds.length === selSorted.length && correctIds.every((id, i) => id === selSorted[i])
    if (match) correct++
  }

  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= quiz.passing_score

  const { data: attempt, error } = await supabase.from('quiz_attempts').insert({
    profile_id: user.id,
    quiz_id:    parsed.data.quiz_id,
    score,
    passed,
    answers:    parsed.data.answers,
  }).select('id').single()
  if (error) return { error: `Abgabe fehlgeschlagen: ${error.message}` }

  // Award XP only on pass, attempt-bonus of 2 XP either way
  let xpEarned = 2
  await awardXp(supabase, {
    profileId:   user.id,
    source:      'quiz_attempt',
    sourceId:    attempt?.id ?? null,
    amount:      2,
    description: `Quiz-Versuch (${score}%)`,
  })
  if (passed) {
    xpEarned += quiz.xp_reward
    await awardXp(supabase, {
      profileId:   user.id,
      source:      'quiz_pass',
      sourceId:    parsed.data.quiz_id,
      amount:      quiz.xp_reward,
      description: `Quiz bestanden (${score}%)`,
    })
  }

  const newBadges = await checkAndGrantBadges(supabase, user.id)

  return { score, passed, xpEarned, newBadges }
}
