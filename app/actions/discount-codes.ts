'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { assertOwner } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface DiscountCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  expires_at: string | null
  max_uses: number | null
  used_count: number
  profile_id: string | null
  recipient_email: string | null
  broadcast_id: string | null
  created_at: string
}

export interface CodeValidation {
  valid: boolean
  code?: DiscountCode
  error?: string
  discount_label?: string  // e.g. "20% Rabatt" or "10€ Rabatt"
}

// ── Generate a human-friendly code ──────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O, 0, I, 1
  let code = 'AXIS-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ── Create one or multiple codes ─────────────────────────────

export async function createDiscountCode(data: {
  description?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  expires_days?: number          // days from now, null = no expiry
  max_uses?: number | null
  profile_id?: string | null
  recipient_email?: string | null
  broadcast_id?: string | null
}): Promise<{ code?: DiscountCode; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const code = generateCode()
  const expires_at = data.expires_days
    ? new Date(Date.now() + data.expires_days * 86400_000).toISOString()
    : null

  const { data: row, error } = await (supabase as any)
    .from('discount_codes')
    .insert({
      code,
      description: data.description ?? null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      expires_at,
      max_uses: data.max_uses ?? null,
      profile_id: data.profile_id ?? null,
      recipient_email: data.recipient_email ?? null,
      broadcast_id: data.broadcast_id ?? null,
      created_by: user?.id,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/broadcast')
  return { code: row as DiscountCode }
}

// ── Bulk-create one code per recipient ───────────────────────

export async function bulkCreateDiscountCodes(data: {
  recipients: { email: string; profile_id?: string | null }[]
  discount_type: 'percent' | 'fixed'
  discount_value: number
  expires_days: number
  description?: string
  broadcast_id?: string
}): Promise<{ codes: string[]; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { codes: [], error: check.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const expires_at = new Date(Date.now() + data.expires_days * 86400_000).toISOString()
  const rows = data.recipients.map(r => ({
    code: generateCode(),
    description: data.description ?? null,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    expires_at,
    profile_id: r.profile_id ?? null,
    recipient_email: r.email,
    broadcast_id: data.broadcast_id ?? null,
    created_by: user?.id,
  }))

  const { data: inserted, error } = await (supabase as any)
    .from('discount_codes')
    .insert(rows)
    .select('code, recipient_email')

  if (error) return { codes: [], error: error.message }
  return { codes: (inserted as any[]).map((r: any) => r.code) }
}

// ── Validate a code (public — uses service client) ───────────

export async function validateDiscountCode(
  code: string,
  email?: string,
): Promise<CodeValidation> {
  const serviceClient = createServiceRoleClient()

  const { data: row, error } = await (serviceClient as any)
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !row) return { valid: false, error: 'Code nicht gefunden.' }

  // Check expiry
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { valid: false, error: 'Code ist abgelaufen.' }
  }

  // Check max uses
  if (row.max_uses !== null && row.used_count >= row.max_uses) {
    return { valid: false, error: 'Code wurde bereits vollständig eingelöst.' }
  }

  // Check personal restriction
  if (row.recipient_email && email && row.recipient_email.toLowerCase() !== email.toLowerCase()) {
    return { valid: false, error: 'Dieser Code ist für eine andere E-Mail-Adresse.' }
  }

  const discount_label = row.discount_type === 'percent'
    ? `${row.discount_value}% Rabatt`
    : `${row.discount_value}€ Rabatt`

  return { valid: true, code: row as DiscountCode, discount_label }
}

// ── Mark code as used ────────────────────────────────────────

export async function redeemDiscountCode(data: {
  code: string
  email?: string
  profile_id?: string
  context?: string
}): Promise<{ success?: true; error?: string }> {
  const serviceClient = createServiceRoleClient()

  const validation = await validateDiscountCode(data.code, data.email)
  if (!validation.valid || !validation.code) {
    return { error: validation.error ?? 'Ungültiger Code.' }
  }

  const codeId = validation.code.id

  // Insert use record
  const { error: useError } = await (serviceClient as any)
    .from('discount_code_uses')
    .insert({
      code_id: codeId,
      profile_id: data.profile_id ?? null,
      email: data.email ?? null,
      context: data.context ?? null,
    })

  if (useError) return { error: useError.message }

  // Increment used_count
  await (serviceClient as any)
    .from('discount_codes')
    .update({ used_count: validation.code.used_count + 1 })
    .eq('id', codeId)

  return { success: true }
}

// ── List all codes (admin) ────────────────────────────────────

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const check = await assertOwner()
  if ('error' in check) return []

  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (data ?? []) as DiscountCode[]
}

// ── Delete a code ─────────────────────────────────────────────

export async function deleteDiscountCode(id: string): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any).from('discount_codes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/broadcast')
  return { success: true }
}
