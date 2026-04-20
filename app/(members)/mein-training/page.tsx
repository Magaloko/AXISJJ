import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTotalXp, progressToNextLevel } from '@/lib/gamification'
import { GraduationCap, BookOpen, ClipboardCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mein Training | AXIS' }

export default async function MeinTrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [curriculaRes, quizAttemptsRes, taskCompletionsRes, totalXp] = await Promise.all([
    supabase
      .from('curricula')
      .select(`
        id, name, description, duration_weeks, age_group,
        curriculum_tracks(
          id, name, sessions_per_week,
          curriculum_sessions(id, week_number, session_number, title, theme)
        )
      `)
      .eq('active', true)
      .eq('age_group', 'adults'),
    supabase
      .from('quiz_attempts')
      .select('quiz_id, passed')
      .eq('profile_id', user.id),
    supabase
      .from('task_completions')
      .select('task_id')
      .eq('profile_id', user.id),
    getTotalXp(supabase, user.id),
  ])

  const progress = progressToNextLevel(totalXp)
  const passedQuizIds = new Set(
    (quizAttemptsRes.data ?? []).filter(a => a.passed).map(a => a.quiz_id)
  )
  const doneTaskIds = new Set((taskCompletionsRes.data ?? []).map(t => t.task_id))

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Mein Training</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dein Lehrplan, Quizzes und Lernaufgaben an einem Ort.
        </p>
      </div>

      {/* XP strip */}
      <div className="mb-8 border border-border bg-card p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Level {progress.level}
          </p>
          <p className="font-mono text-sm text-foreground">{totalXp} XP</p>
        </div>
        <div className="h-2 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {progress.current} / {progress.needed} zum nächsten Level
        </p>
      </div>

      {(curriculaRes.data ?? []).length === 0 ? (
        <div className="border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Noch kein aktiver Lehrplan für dich — dein Coach legt gerade einen an.
        </div>
      ) : (
        <div className="space-y-8">
          {(curriculaRes.data ?? []).map(cur => {
            const tracks = cur.curriculum_tracks ?? []
            return (
              <div key={cur.id} className="border border-border bg-card">
                <div className="border-b border-border p-5">
                  <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
                    <GraduationCap size={18} className="text-primary" />
                    {cur.name}
                  </h2>
                  {cur.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{cur.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {cur.duration_weeks} Wochen · {tracks.length} Programme
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {tracks.map(track => {
                    const sessions = (track.curriculum_sessions ?? []).slice().sort((a, b) => {
                      if (a.week_number !== b.week_number) return a.week_number - b.week_number
                      return a.session_number - b.session_number
                    })
                    return (
                      <details key={track.id} className="group">
                        <summary className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-muted/30">
                          <div>
                            <p className="font-bold text-foreground">{track.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {sessions.length} Sessions
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                        </summary>
                        <ul className="border-t border-border/50 bg-muted/10">
                          {sessions.map(s => (
                            <li key={s.id} className="border-b border-border/30 last:border-b-0">
                              <Link
                                href={`/mein-training/session/${s.id}`}
                                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/30"
                              >
                                <div className="flex items-baseline gap-3">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    W{s.week_number}.{s.session_number}
                                  </span>
                                  <span className="font-semibold text-foreground">{s.title}</span>
                                  {s.theme && <span className="text-xs text-muted-foreground">· {s.theme}</span>}
                                </div>
                                <span className="text-xs text-primary">Öffnen →</span>
                              </Link>
                            </li>
                          ))}
                          {sessions.length === 0 && (
                            <li className="px-5 py-3 text-xs text-muted-foreground">Noch keine Sessions</li>
                          )}
                        </ul>
                      </details>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/bjj-rules"
          className="flex items-center gap-3 border border-border bg-card p-5 hover:border-primary"
        >
          <BookOpen size={24} className="text-primary" />
          <div>
            <p className="font-bold text-foreground">BJJ-Regel-Training</p>
            <p className="text-xs text-muted-foreground">Eine Karte nach der anderen. +2 XP pro richtig.</p>
          </div>
        </Link>
        <Link
          href="/leaderboard"
          className="flex items-center gap-3 border border-border bg-card p-5 hover:border-primary"
        >
          <ClipboardCheck size={24} className="text-primary" />
          <div>
            <p className="font-bold text-foreground">Leaderboard</p>
            <p className="text-xs text-muted-foreground">Wer sammelt die meisten XP?</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
