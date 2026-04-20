'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export interface Subscription {
  id: string
  profile_id: string
  category: 'students' | 'adults' | 'kids'
  duration_months: number
  price_per_month: number
  start_date: string
  end_date: string | null
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  payment_method: 'sepa' | 'bar' | 'ueberweisung' | 'karte' | null
  notes: string | null
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  profile_id: z.string().uuid(),
  category: z.enum(['students', 'adults', 'kids']),
  duration_months: z.number().int().refine(v => [1, 3, 6, 12].includes(v), 'Ungültige Laufzeit'),
  price_per_month: z.number().nonnegative(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Startdatum'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(['active', 'paused', 'cancelled', 'expired']).default('active'),
  payment_method: z.enum(['sepa', 'bar', 'ueberweisung', 'karte']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type SubscriptionInput = z.infer<typeof upsertSchema>

export async function upsertSubscription(
  data: SubscriptionInput,
): Promise<{ success?: true; id?: string; error?: string }> {
  const parsed = upsertSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const payload = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    profile_id: parsed.data.profile_id,
    category: parsed.data.category,
    duration_months: parsed.data.duration_months,
    price_per_month: parsed.data.price_per_month,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date ?? null,
    status: parsed.data.status,
    payment_method: parsed.data.payment_method ?? null,
    notes: parsed.data.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data: row, error } = await supabase
    .from('subscriptions')
    .upsert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[subscriptions] upsert error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  await logAudit({
    action: parsed.data.id ? 'subscription.updated' : 'subscription.created',
    targetType: 'profile',
    targetId: parsed.data.profile_id,
    meta: { category: parsed.data.category, duration_months: parsed.data.duration_months, price_per_month: parsed.data.price_per_month, status: parsed.data.status },
  })

  revalidatePath('/admin/mitglieder')
  revalidatePath('/dashboard')
  return { success: true, id: row.id }
}

export async function deleteSubscription(id: string): Promise<{ success?: true; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  await logAudit({ action: 'subscription.deleted', targetType: 'subscription', targetId: id })
  revalidatePath('/admin/mitglieder')
  return { success: true }
}

export async function getSubscriptionsForMember(profileId: string): Promise<Subscription[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', profileId)
    .order('start_date', { ascending: false })
  return (data ?? []) as Subscription[]
}

export async function getMyActiveSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as Subscription | null
}
