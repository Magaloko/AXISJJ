'use server'

import { createClient } from '@/lib/supabase/server'
import { getActionErrors } from '@/lib/i18n/action-lang'

type Role = 'member' | 'coach' | 'owner'

export type AuthResult = { userId: string; role: Role } | { error: string }

export async function assertRole(roles: Role[]): Promise<AuthResult> {
  const e = await getActionErrors()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: e.notAuthenticated }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !roles.includes(caller.role)) return { error: e.notAuthorized }
  return { userId: user.id, role: caller.role }
}

export const assertOwner = async () => assertRole(['owner'])
export const assertStaff = async () => assertRole(['coach', 'owner'])
