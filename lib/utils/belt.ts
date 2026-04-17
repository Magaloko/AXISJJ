// lib/utils/belt.ts

/**
 * Calculates belt promotion readiness as a percentage (0–100).
 * Each component (sessions, time) contributes up to 50 points.
 * If a requirement is null (not applicable), that component is treated as fully met (50 pts).
 * If both are null, returns 0 (coach decides entirely).
 */
export function calcReadiness(
  sessionsAttended: number,
  minSessions: number | null,
  monthsInGrade: number,
  minTimeMonths: number | null
): number {
  if (!minSessions && !minTimeMonths) return 0
  const s = minSessions ? Math.min(50, (sessionsAttended / minSessions) * 50) : 50
  const t = minTimeMonths ? Math.min(50, (monthsInGrade / minTimeMonths) * 50) : 50
  return Math.min(100, Math.round(s + t))
}
