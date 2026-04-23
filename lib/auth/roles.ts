/**
 * Centralised role helpers for AXISJJ.
 *
 * Role hierarchy (low → high):
 *   member < coach = trainer < owner < developer
 *
 * trainer: same staff access as coach, focused on training reports.
 * developer: super-admin, has all owner rights plus /admin/developer.
 */

export type AppRole = 'member' | 'coach' | 'trainer' | 'owner' | 'developer'

/** owner OR developer — full management access */
export function isOwnerLevel(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'developer'
}

/** coach OR trainer OR owner OR developer — staff-level access */
export function isStaffLevel(role: string | null | undefined): boolean {
  return role === 'coach' || role === 'trainer' || role === 'owner' || role === 'developer'
}

/** Only the developer role */
export function isDeveloper(role: string | null | undefined): boolean {
  return role === 'developer'
}

/** Safe cast — falls back to 'member' for unknown values */
export function toAppRole(raw: string | null | undefined): AppRole {
  if (raw === 'coach' || raw === 'trainer' || raw === 'owner' || raw === 'developer') return raw
  return 'member'
}

/**
 * Map AppRole to the AdminNav "Role" type (coach | owner | developer).
 * trainer maps to 'coach' since they share the same admin nav view.
 * Members never reach the admin panel.
 */
export type AdminRole = 'coach' | 'owner' | 'developer'

export function toAdminRole(role: string | null | undefined): AdminRole {
  if (role === 'owner' || role === 'developer') return role
  return 'coach' // coach and trainer both get the coach nav view
}
