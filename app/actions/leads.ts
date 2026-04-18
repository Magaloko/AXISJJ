// app/actions/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LeadSchema } from './leads.schema'

/**
 * Phase 1 public contact-form action (kept for the /trial page).
 * Renamed from `createLead` to free that name for the admin action below.
 */
export async function submitTrialLead(
  data: unknown,
): Promise<{ success?: boolean; error?: string }> {
  const parsed = LeadSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Bitte alle Pflichtfelder korrekt ausfüllen.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    source: 'website',
    status: 'new',
  })

  if (error) {
    return { error: 'Fehler beim Speichern. Bitte versuche es erneut.' }
  }

  return { success: true }
}

const VALID_LEAD_STATUS = ['new', 'contacted', 'converted', 'lost'] as const
type LeadStatus = typeof VALID_LEAD_STATUS[number]

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<{ success?: true; error?: string }> {
  if (!VALID_LEAD_STATUS.includes(status)) return { error: 'Ungültiger Status.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !['coach', 'owner'].includes(caller.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  const { error } = await (supabase.from('leads') as any)
    .update({ status })
    .eq('id', leadId)
  if (error) return { error: 'Status-Update fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export interface NewLeadData {
  full_name: string
  email: string
  phone?: string
  message?: string
  source: 'website' | 'instagram'
}

export async function createLead(
  data: NewLeadData,
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !['coach', 'owner'].includes(caller.role)) {
    return { error: 'Keine Berechtigung.' }
  }

  if (!data.full_name?.trim() || !data.email?.trim()) {
    return { error: 'Name und E-Mail sind Pflicht.' }
  }

  const { error } = await (supabase.from('leads') as any).insert({
    full_name: data.full_name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || null,
    message: data.message?.trim() || null,
    source: data.source,
    status: 'new',
  })
  if (error) return { error: 'Lead-Erstellung fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
