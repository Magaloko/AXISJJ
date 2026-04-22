import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

interface BookingRow {
  profile_id: string
  session_id: string
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
}

interface SessionMeta {
  id: string
  starts_at: string
  class_types: { name: string } | { name: string }[] | null
}

/**
 * /fehlen — coach/owner view of members who booked a session that already
 * started today but haven't checked in. Mirrors the missingCheckins logic
 * from getAdminDashboard so staff have parity between bot and admin UI.
 */
export const fehlenCommand: Command = {
  name: 'fehlen',
  allowedRoles: ['admin', 'moderator', 'coach'],
  handler: async (ctx) => {
    const supabase = createServiceRoleClient()

    const now = new Date()
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date()
    dayEnd.setHours(23, 59, 59, 999)

    const { data: sessions } = await supabase
      .from('class_sessions')
      .select('id, starts_at, class_types(name)')
      .eq('cancelled', false)
      .gte('starts_at', dayStart.toISOString())
      .lte('starts_at', now.toISOString())

    const startedSessions = (sessions ?? []) as SessionMeta[]
    if (startedSessions.length === 0) {
      await sendMessage(ctx.chatId, 'Heute hat noch keine Klasse begonnen.')
      return
    }
    const startedIds = startedSessions.map((s) => s.id)

    const [bookingsRes, attendancesRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('profile_id, session_id, profiles(full_name)')
        .eq('status', 'confirmed')
        .in('session_id', startedIds),
      supabase
        .from('attendances')
        .select('profile_id, session_id')
        .in('session_id', startedIds)
        .gte('checked_in_at', dayStart.toISOString())
        .lte('checked_in_at', dayEnd.toISOString()),
    ])

    if (bookingsRes.error) {
      console.error('[bot/fehlen] bookings error:', bookingsRes.error)
      await sendMessage(ctx.chatId, '⚠️ Konnte Buchungen nicht laden.')
      return
    }

    const checkedIn = new Set(
      (attendancesRes.data ?? []).map((a) => `${a.profile_id}:${a.session_id}`),
    )
    const sessionMeta = new Map(
      startedSessions.map((s) => {
        const ct = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
        return [s.id, { name: ct?.name ?? 'Session', starts_at: s.starts_at }]
      }),
    )

    const missing: { name: string; className: string; time: string }[] = []
    for (const row of (bookingsRes.data ?? []) as BookingRow[]) {
      const key = `${row.profile_id}:${row.session_id}`
      if (checkedIn.has(key)) continue
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      const meta = sessionMeta.get(row.session_id)
      const d = meta ? new Date(meta.starts_at) : new Date()
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      missing.push({
        name: p?.full_name ?? 'Unbekannt',
        className: meta?.name ?? 'Session',
        time: `${hh}:${mm}`,
      })
    }

    if (missing.length === 0) {
      await sendMessage(ctx.chatId, '✅ Alle gebuchten Mitglieder sind da.')
      return
    }

    missing.sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name))
    const header = `⚠️ Fehlt heute (${missing.length})`
    const lines = missing.slice(0, 20).map((m) => `${m.time} · ${m.name} · ${m.className}`)
    const tail = missing.length > 20 ? `\n+${missing.length - 20} weitere` : ''
    await sendMessage(ctx.chatId, `${header}\n\n${lines.join('\n')}${tail}`)
  },
}
