'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertOwner } from '@/lib/auth'
import { memberUpdateSchema, memberRoleSchema } from './members.schema'
import { logAudit } from '@/lib/audit'
import { getActionErrors } from '@/lib/i18n/action-lang'

export type MemberUpdate = {
  full_name?: string
  phone?: string | null
  date_of_birth?: string | null
}

export async function updateMember(
  profileId: string,
  data: MemberUpdate,
): Promise<{ success?: true; error?: string }> {
  const e = await getActionErrors()

  const parsed = memberUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: e.invalidInput }

  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const payload: { full_name?: string; phone?: string | null; date_of_birth?: string | null } = {}
  if (parsed.data.full_name !== undefined) payload.full_name = parsed.data.full_name.trim()
  if (parsed.data.phone !== undefined) payload.phone = parsed.data.phone?.trim() || null
  if (parsed.data.date_of_birth !== undefined) payload.date_of_birth = parsed.data.date_of_birth || null

  if (!Object.keys(payload).length) return { error: e.noChanges }

  const changedFields = Object.keys(payload)

  const { error } = await supabase.from('profiles')
    .update(payload)
    .eq('id', profileId)
  if (error) return { error: e.updateFailed }

  revalidatePath('/admin/mitglieder')

  // Fire-and-forget notification: fetch member name
  try {
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profileId)
      .single()
    const memberName = memberProfile?.full_name ?? 'Unbekannt'
    waitUntil(notify({
      type: 'member.updated',
      data: { memberName, changedFields },
    }))
    waitUntil(logAudit({
      action: 'member.updated',
      targetType: 'profile',
      targetId: profileId,
      targetName: memberName,
      meta: { changedFields },
    }))
  } catch {
    // best-effort
  }

  return { success: true }
}

export async function updateMemberRole(
  profileId: string,
  role: 'member' | 'coach' | 'owner' | 'developer',
): Promise<{ success?: true; error?: string }> {
  const e = await getActionErrors()

  if (!memberRoleSchema.safeParse(role).success) return { error: e.invalidRole }

  const check = await assertOwner()
  if ('error' in check) return { error: check.error }
  if (check.userId === profileId) return { error: e.selfRoleChange }

  const supabase = await createClient()

  // Fetch existing role + name before update
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', profileId)
    .single()

  const { error } = await supabase.from('profiles')
    .update({ role: role as 'member' | 'coach' | 'owner' })
    .eq('id', profileId)
  if (error) return { error: e.memberRoleUpdateFailed }

  revalidatePath('/admin/mitglieder')
  revalidatePath('/admin/einstellungen')

  if (existingProfile) {
    const memberName = existingProfile.full_name ?? 'Unbekannt'
    const oldRole = existingProfile.role ?? 'unbekannt'
    waitUntil(notify({
      type: 'member.role_changed',
      data: { memberName, oldRole, newRole: role },
    }))
    waitUntil(logAudit({
      action: 'member.role_changed',
      targetType: 'profile',
      targetId: profileId,
      targetName: memberName,
      meta: { oldRole, newRole: role },
    }))
  }

  // Auto-create coach_profiles row when promoting to coach
  if (role === 'coach') {
    await supabase
      .from('coach_profiles')
      .upsert({ profile_id: profileId }, { onConflict: 'profile_id' })
  }

  return { success: true }
}
