'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ─── Curricula ─────────────────────────────────────────────────

const createCurriculumSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  duration_weeks: z.number().int().min(1).max(52).default(4),
  age_group: z.enum(['adults', 'kids']).default('adults'),
})

export async function createCurriculum(
  data: z.infer<typeof createCurriculumSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = createCurriculumSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const baseSlug = slugify(parsed.data.name)
  const slug = `${baseSlug}-${Date.now().toString(36)}`

  const { data: row, error } = await supabase
    .from('curricula')
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      duration_weeks: parsed.data.duration_weeks,
      age_group: parsed.data.age_group,
      created_by: auth.userId,
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[curriculum] create error:', error)
    return { error: `Anlegen fehlgeschlagen: ${error?.message ?? 'unbekannt'}` }
  }

  await logAudit({
    action: 'curriculum.created',
    targetType: 'curriculum',
    targetId: row.id,
    meta: { name: parsed.data.name, age_group: parsed.data.age_group },
  })

  revalidatePath('/admin/curriculum')
  return { id: row.id }
}

const updateCurriculumSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(1000).nullable(),
  duration_weeks: z.number().int().min(1).max(52),
  age_group: z.enum(['adults', 'kids']),
  active: z.boolean(),
})

export async function updateCurriculum(
  data: z.infer<typeof updateCurriculumSchema>,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateCurriculumSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('curricula')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      duration_weeks: parsed.data.duration_weeks,
      age_group: parsed.data.age_group,
      active: parsed.data.active,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }

  await logAudit({
    action: 'curriculum.updated',
    targetType: 'curriculum',
    targetId: parsed.data.id,
    meta: { name: parsed.data.name },
  })

  revalidatePath('/admin/curriculum')
  revalidatePath(`/admin/curriculum/${parsed.data.id}`)
  return { success: true }
}

export async function deleteCurriculum(
  id: string,
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('curricula').delete().eq('id', id)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  await logAudit({ action: 'curriculum.deleted', targetType: 'curriculum', targetId: id })
  revalidatePath('/admin/curriculum')
  return { success: true }
}

// ─── Tracks ────────────────────────────────────────────────────

const createTrackSchema = z.object({
  curriculum_id:     z.string().uuid(),
  class_type_id:     z.string().uuid(),
  name:              z.string().min(2).max(100),
  sessions_per_week: z.number().int().min(1).max(7),
})

export async function createTrack(
  data: z.infer<typeof createTrackSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = createTrackSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: maxRow } = await supabase
    .from('curriculum_tracks')
    .select('sort_order')
    .eq('curriculum_id', parsed.data.curriculum_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: row, error } = await supabase
    .from('curriculum_tracks')
    .insert({
      curriculum_id:     parsed.data.curriculum_id,
      class_type_id:     parsed.data.class_type_id,
      name:              parsed.data.name,
      sessions_per_week: parsed.data.sessions_per_week,
      sort_order:        (maxRow?.sort_order ?? -1) + 1,
    })
    .select('id')
    .single()

  if (error || !row) return { error: `Anlegen fehlgeschlagen: ${error?.message ?? 'unbekannt'}` }

  revalidatePath(`/admin/curriculum/${parsed.data.curriculum_id}`)
  return { id: row.id }
}

export async function deleteTrack(
  trackId: string,
  curriculumId: string,
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('curriculum_tracks').delete().eq('id', trackId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  revalidatePath(`/admin/curriculum/${curriculumId}`)
  return { success: true }
}

// ─── Sessions ──────────────────────────────────────────────────

const createSessionSchema = z.object({
  track_id:       z.string().uuid(),
  week_number:    z.number().int().min(1).max(52),
  session_number: z.number().int().min(1).max(7),
  title:          z.string().min(2).max(120),
  theme:          z.string().max(200).optional(),
})

export async function createSession(
  data: z.infer<typeof createSessionSchema>,
): Promise<{ id?: string; error?: string }> {
  const parsed = createSessionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('curriculum_sessions')
    .insert({
      track_id:       parsed.data.track_id,
      week_number:    parsed.data.week_number,
      session_number: parsed.data.session_number,
      title:          parsed.data.title,
      theme:          parsed.data.theme ?? null,
    })
    .select('id, track_id')
    .single()

  if (error || !row) {
    const msg = error?.code === '23505'
      ? 'Diese Session existiert bereits (gleiche Woche + Nummer).'
      : `Anlegen fehlgeschlagen: ${error?.message ?? 'unbekannt'}`
    return { error: msg }
  }

  const { data: track } = await supabase
    .from('curriculum_tracks')
    .select('curriculum_id')
    .eq('id', row.track_id)
    .single()

  if (track) revalidatePath(`/admin/curriculum/${track.curriculum_id}`)
  return { id: row.id }
}

const updateSessionSchema = z.object({
  id:               z.string().uuid(),
  title:            z.string().min(2).max(120),
  theme:            z.string().max(200).nullable(),
  objectives:       z.array(z.string().max(200)).max(10),
  warmup:           z.string().max(2000).nullable(),
  drilling:         z.string().max(2000).nullable(),
  sparring_focus:   z.string().max(2000).nullable(),
  homework:         z.string().max(2000).nullable(),
  duration_minutes: z.number().int().min(10).max(240),
})

export async function updateSession(
  data: z.infer<typeof updateSessionSchema>,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateSessionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('curriculum_sessions')
    .update({
      title:            parsed.data.title,
      theme:            parsed.data.theme,
      objectives:       parsed.data.objectives,
      warmup:           parsed.data.warmup,
      drilling:         parsed.data.drilling,
      sparring_focus:   parsed.data.sparring_focus,
      homework:         parsed.data.homework,
      duration_minutes: parsed.data.duration_minutes,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: `Speichern fehlgeschlagen: ${error.message}` }

  revalidatePath('/admin/curriculum')
  return { success: true }
}

export async function deleteSession(
  sessionId: string,
  curriculumId: string,
): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('curriculum_sessions').delete().eq('id', sessionId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  revalidatePath(`/admin/curriculum/${curriculumId}`)
  return { success: true }
}
