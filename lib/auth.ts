'use server'

import { createClient } from '@/lib/supabase/server'

type Role = 'member' | 'coach' | 'owner'

export type AuthResult = { userId: string; role: Role } | { error: string }

export async function assertRole(roles: Role[]): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }
  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !roles.includes(caller.role)) return { error: 'Keine Berechtigung.' }
  return { userId: user.id, role: caller.role }
}

export const assertOwner = () => assertRole(['owner'])
export const assertStaff = () => assertRole(['coach', 'owner'])
