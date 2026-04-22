/**
 * Centralised role helpers for AXISJJ.
 *
 * Role hierarchy (low → high):
 *   member < coach < owner < developer
 *
 * developer is a super-admin used by the app developer.
 * It has all owner rights plus access to /admin/developer.
 */

export type AppRole = 'member' | 'coach' | 'owner' | 'developer'

/** owner OR developer — full management access */
export function isOwnerLevel(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'developer'
}

/** coach OR owner OR developer — staff-level access */
export function isStaffLevel(role: string | null | undefined): boolean {
  return role === 'coach' || role === 'owner' || role === 'developer'
}

/** Only the developer role */
export function isDeveloper(role: string | null | undefined): boolean {
  return role === 'developer'
}

/** Safe cast — falls back to 'member' for unknown values */
export function toAppRole(raw: string | null | undefined): AppRole {
  if (raw === 'coach' || raw === 'owner' || raw === 'developer') return raw
  return 'member'
}

/**
 * Map AppRole to the AdminNav "Role" type (coach | owner | developer).
 * Members are never shown the admin panel so 'member' never reaches AdminNav.
 */
export type AdminRole = 'coach' | 'owner' | 'developer'

export function toAdminRole(role: string | null | undefined): AdminRole {
  if (role === 'owner' || role === 'developer') return role
  return 'coach'
}
