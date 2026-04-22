'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ratingSchema = z.object({
  session_id: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional().nullable(),
})

export interface SessionRating {
  id: string
  session_id: string
  profile_id: string
  rating: number
  notes: string | null
  created_at: string
  profile_name?: string | null
}

// ── Submit or update a rating (member or coach) ──────────────

export async function upsertSessionRating(data: {
  session_id: string
  rating: number
  notes?: string | null
}): Promise<{ success?: true; error?: string }> {
  const parsed = ratingSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await (supabase as any)
    .from('session_ratings')
    .upsert({
      session_id: parsed.data.session_id,
      profile_id: user.id,
      rating: parsed.data.rating,
      notes: parsed.data.notes ?? null,
    }, { onConflict: 'session_id,profile_id' })

  if (error) return { error: error.message }
  revalidatePath(`/admin/klassen/${data.session_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Get ratings for a session (staff) ───────────────────────

export async function getSessionRatings(sessionId: string): Promise<SessionRating[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['coach', 'owner', 'developer'].includes(profile.role)) return []

  const { data: ratings } = await (supabase as any)
    .from('session_ratings')
    .select('id, session_id, profile_id, rating, notes, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (!ratings?.length) return []

  const profileIds = [...new Set((ratings as any[]).map((r: any) => r.profile_id))]
  const { data: profiles } = await supabase
    .from('profiles').select('id, full_name').in('id', profileIds)
  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))

  return (ratings as any[]).map((r: any) => ({
    ...r,
    profile_name: nameMap.get(r.profile_id) ?? null,
  }))
}

// ── Get own rating for a session (member) ───────────────────

export async function getMySessionRating(sessionId: string): Promise<SessionRating | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('session_ratings')
    .select('id, session_id, profile_id, rating, notes, created_at')
    .eq('session_id', sessionId)
    .eq('profile_id', user.id)
    .single()

  return (data as SessionRating) ?? null
}
