// app/actions/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LeadSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export async function createLead(data: unknown): Promise<{ success?: boolean; error?: string }> {
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
