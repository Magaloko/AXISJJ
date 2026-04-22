'use server'

import { createClient } from '@/lib/supabase/server'
import { getActionErrors } from '@/lib/i18n/action-lang'

export type Role = 'member' | 'coach' | 'owner' | 'developer'

export type AuthResult = { userId: string; role: Role } | { error: string }

export async function assertRole(roles: Role[]): Promise<AuthResult> {
  const e = await getActionErrors()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: e.notAuthenticated }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !roles.includes(caller.role as Role)) return { error: e.notAuthorized }
  return { userId: user.id, role: caller.role as Role }
}

/** owner or developer — full management rights */
export const assertOwner = async () => assertRole(['owner', 'developer'])
export const assertStaff = async () => assertRole(['coach', 'owner', 'developer'])
