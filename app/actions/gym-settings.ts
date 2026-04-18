'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import type { OpeningHours } from '@/lib/gym-settings'
import { DAY_KEYS } from '@/lib/opening-hours'

async function assertOwner(): Promise<true | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return true
}

export interface GymInfoUpdate {
  name: string
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
}

export async function updateGymInfo(data: GymInfoUpdate): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }
  if (!data.name?.trim()) return { error: 'Name ist Pflicht.' }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    address_line1: data.address_line1?.trim() || null,
    address_line2: data.address_line2?.trim() || null,
    postal_code: data.postal_code?.trim() || null,
    city: data.city?.trim() || null,
    country: data.country?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    website: data.website?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await (supabase.from('gym_settings') as any).update(payload).eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  waitUntil(notify({ type: 'gym.info_updated', data: {} }))
  return { success: true }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function validateHours(hours: OpeningHours): string | null {
  for (const key of DAY_KEYS) {
    const day = hours[key]
    if (!day) return `Tag fehlt: ${key}`
    if (day.closed) continue
    if (!day.open || !day.close) return `Zeiten fehlen für ${key}`
    if (!TIME_RE.test(day.open) || !TIME_RE.test(day.close)) return `Ungültige Zeit für ${key}`
  }
  return null
}

export async function updateOpeningHours(hours: OpeningHours): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const validationError = validateHours(hours)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await (supabase.from('gym_settings') as any)
    .update({ opening_hours: hours, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  waitUntil(notify({ type: 'gym.hours_updated', data: {} }))
  return { success: true }
}

export interface PoliciesUpdate {
  house_rules?: string | null
  cancellation_policy?: string | null
  pricing_info?: string | null
}

export async function updatePolicies(data: PoliciesUpdate): Promise<{ success?: true; error?: string }> {
  const ok = await assertOwner()
  if (ok !== true) return { error: ok.error }

  const supabase = await createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.house_rules !== undefined) payload.house_rules = data.house_rules?.trim() || null
  if (data.cancellation_policy !== undefined) payload.cancellation_policy = data.cancellation_policy?.trim() || null
  if (data.pricing_info !== undefined) payload.pricing_info = data.pricing_info?.trim() || null

  const { error } = await (supabase.from('gym_settings') as any).update(payload).eq('id', 1)
  if (error) return { error: 'Speichern fehlgeschlagen.' }
  revalidatePath('/', 'layout')
  waitUntil(notify({ type: 'gym.policies_updated', data: {} }))
  return { success: true }
}
