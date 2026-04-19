// app/actions/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { LeadSchema } from './leads.schema'
import { assertStaff } from '@/lib/auth'
import { z } from 'zod'

const newLeadSchema = z.object({
  full_name: z.string().min(2, 'Name ist Pflicht'),
  email: z.string().email('Ungültige E-Mail'),
  phone: z.string().max(20).optional(),
  message: z.string().max(1000).optional(),
  source: z.enum(['website', 'instagram']),
})

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

  waitUntil(notify({
    type: 'lead.created',
    data: {
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      message: parsed.data.message ?? null,
      source: 'website',
    },
  }))
  return { success: true }
}

const VALID_LEAD_STATUS = ['new', 'contacted', 'converted', 'lost'] as const
type LeadStatus = typeof VALID_LEAD_STATUS[number]

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<{ success?: true; error?: string }> {
  if (!VALID_LEAD_STATUS.includes(status)) return { error: 'Ungültiger Status.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  // Fetch current lead info for notification (old status + identity)
  const { data: existingLead } = await supabase
    .from('leads')
    .select('full_name, email, status')
    .eq('id', leadId)
    .single()

  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
  if (error) return { error: 'Status-Update fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')

  if (existingLead) {
    waitUntil(notify({
      type: 'lead.status_changed',
      data: {
        full_name: existingLead.full_name ?? 'Unbekannt',
        email: existingLead.email ?? '',
        oldStatus: existingLead.status ?? 'unbekannt',
        newStatus: status,
      },
    }))
  }
  return { success: true }
}

export type NewLeadData = z.infer<typeof newLeadSchema>

export async function createLead(
  data: NewLeadData,
): Promise<{ success?: true; error?: string }> {
  const parsed = newLeadSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    full_name: parsed.data.full_name.trim(),
    email: parsed.data.email.trim(),
    phone: parsed.data.phone?.trim() || null,
    message: parsed.data.message?.trim() || null,
    source: parsed.data.source,
    status: 'new',
  })
  if (error) return { error: 'Lead-Erstellung fehlgeschlagen.' }

  revalidatePath('/admin/leads')
  revalidatePath('/admin/dashboard')

  waitUntil(notify({
    type: 'lead.created',
    data: {
      full_name: parsed.data.full_name.trim(),
      email: parsed.data.email.trim(),
      phone: parsed.data.phone?.trim() || null,
      message: parsed.data.message?.trim() || null,
      source: parsed.data.source,
    },
  }))
  return { success: true }
}
