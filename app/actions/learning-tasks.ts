'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { awardXp, checkAndGrantBadges } from '@/lib/gamification'

const saveTaskSchema = z.object({
  id:          z.string().uuid().optional(),
  session_id:  z.string().uuid().nullable(),
  title:       z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  task_type:   z.enum(['reflection', 'drill', 'journal', 'video', 'reading']),
  xp_reward:   z.number().int().min(0).max(100),
})

export async function saveLearningTask(
  data: z.infer<typeof saveTaskSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = saveTaskSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültig.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  if (parsed.data.id) {
    const { error } = await supabase
      .from('learning_tasks')
      .update({
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        task_type:   parsed.data.task_type,
        xp_reward:   parsed.data.xp_reward,
      })
      .eq('id', parsed.data.id)
    if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }

    if (parsed.data.session_id) revalidatePath(`/admin/curriculum/session/${parsed.data.session_id}`)
    return { id: parsed.data.id }
  }

  const { count } = await supabase
    .from('learning_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', parsed.data.session_id!)

  const { data: row, error } = await supabase
    .from('learning_tasks')
    .insert({
      session_id:  parsed.data.session_id,
      title:       parsed.data.title,
      description: parsed.data.description ?? null,
      task_type:   parsed.data.task_type,
      xp_reward:   parsed.data.xp_reward,
      sort_order:  count ?? 0,
    })
    .select('id')
    .single()

  if (error || !row) return { error: `Anlegen fehlgeschlagen: ${error?.message ?? '?'}` }

  if (parsed.data.session_id) revalidatePath(`/admin/curriculum/session/${parsed.data.session_id}`)
  return { id: row.id }
}

export async function deleteLearningTask(
  taskId: string,
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: t } = await supabase.from('learning_tasks').select('session_id').eq('id', taskId).single()
  const { error } = await supabase.from('learning_tasks').delete().eq('id', taskId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  if (t?.session_id) revalidatePath(`/admin/curriculum/session/${t.session_id}`)
  return { success: true }
}

// ─── Member: mark complete ───────────────────────────────────

export async function completeTask(
  taskId: string,
  notes?: string,
): Promise<{ success?: true; xpEarned?: number; newBadges?: string[]; error?: string }> {
  if (!z.string().uuid().safeParse(taskId).success) return { error: 'Ungültige ID.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  // Was it already completed? We only award XP on first completion.
  const { data: existing } = await supabase
    .from('task_completions')
    .select('task_id')
    .eq('profile_id', user.id)
    .eq('task_id', taskId)
    .maybeSingle()

  const { error } = await supabase
    .from('task_completions')
    .upsert({
      profile_id:   user.id,
      task_id:      taskId,
      notes:        notes?.trim() || null,
      completed_at: new Date().toISOString(),
    })

  if (error) return { error: `Abgeschlossen-Markieren fehlgeschlagen: ${error.message}` }

  let xpEarned = 0
  let newBadges: string[] = []
  if (!existing) {
    const { data: task } = await supabase
      .from('learning_tasks')
      .select('xp_reward, title')
      .eq('id', taskId)
      .single()
    if (task && task.xp_reward > 0) {
      xpEarned = task.xp_reward
      await awardXp(supabase, {
        profileId:   user.id,
        source:      'task_complete',
        sourceId:    taskId,
        amount:      task.xp_reward,
        description: `Task: ${task.title}`,
      })
    }
    newBadges = await checkAndGrantBadges(supabase, user.id)
  }

  return { success: true, xpEarned, newBadges }
}
