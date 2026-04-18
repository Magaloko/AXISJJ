'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertOwner(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }
  return { userId: user.id }
}

export interface MemberUpdate {
  full_name?: string
  phone?: string | null
  date_of_birth?: string | null
}

export async function updateMember(
  profileId: string,
  data: MemberUpdate,
): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const payload: Record<string, unknown> = {}
  if (data.full_name !== undefined) payload.full_name = data.full_name.trim()
  if (data.phone !== undefined) payload.phone = data.phone?.trim() || null
  if (data.date_of_birth !== undefined) payload.date_of_birth = data.date_of_birth || null

  if (!Object.keys(payload).length) return { error: 'Keine Änderungen.' }

  const { error } = await (supabase.from('profiles') as any)
    .update(payload)
    .eq('id', profileId)
  if (error) return { error: 'Update fehlgeschlagen.' }

  revalidatePath('/admin/mitglieder')
  return { success: true }
}

export async function updateMemberRole(
  profileId: string,
  role: 'member' | 'coach',
): Promise<{ success?: true; error?: string }> {
  if (role !== 'member' && role !== 'coach') return { error: 'Ungültige Rolle.' }

  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  if (check.userId === profileId) return { error: 'Eigene Rolle kann nicht geändert werden.' }

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', profileId)
  if (error) return { error: 'Rollen-Update fehlgeschlagen.' }

  revalidatePath('/admin/mitglieder')
  revalidatePath('/admin/einstellungen')
  return { success: true }
}
