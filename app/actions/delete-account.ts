'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit'

const deleteAccountSchema = z.object({
  confirmation: z.string(),
})

export async function deleteMyAccount(
  input: { confirmation: string },
): Promise<{ success?: true; error?: string }> {
  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  if (parsed.data.confirmation !== 'ACCOUNT LÖSCHEN') {
    return { error: 'Zur Bestätigung tippe exakt "ACCOUNT LÖSCHEN".' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  // Don't allow owner to delete themselves (safety)
  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role === 'owner') {
    return { error: 'Owner-Accounts können nicht selbst gelöscht werden. Wende dich an den System-Admin.' }
  }

  // Log BEFORE deleting (the actor disappears after delete)
  await logAudit({
    action: 'account.deleted',
    targetType: 'profile',
    targetId: user.id,
    targetName: profile?.full_name ?? user.email ?? 'Unbekannt',
    meta: { role: profile?.role, email: user.email },
  })

  // Delete auth user — cascades to profiles via ON DELETE CASCADE
  const admin = createServiceRoleClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[delete-account] error:', error)
    return { error: `Löschen fehlgeschlagen: ${error.message}` }
  }

  return { success: true }
}
