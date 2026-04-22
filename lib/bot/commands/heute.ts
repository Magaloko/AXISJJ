import type { Command } from '../router'
import { sendMessage } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

interface TodaySession {
  id: string
  starts_at: string
  capacity: number
  class_types: { name: string } | { name: string }[] | null
  bookings: { status: string }[] | null
}

/**
 * /heute — coach/owner view of today's sessions with booking counts.
 * Plain-text, no keyboards. For deeper drill-in the staff uses the web app.
 */
export const heuteCommand: Command = {
  name: 'heute',
  allowedRoles: ['admin', 'moderator', 'coach'],
  handler: async (ctx) => {
    const supabase = createServiceRoleClient()

    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date()
    dayEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('class_sessions')
      .select('id, starts_at, capacity, class_types(name), bookings(status)')
      .eq('cancelled', false)
      .gte('starts_at', dayStart.toISOString())
      .lte('starts_at', dayEnd.toISOString())
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('[bot/heute] query error:', error)
      await sendMessage(ctx.chatId, '⚠️ Konnte heutige Klassen nicht laden.')
      return
    }

    const rows = (data ?? []) as TodaySession[]
    if (rows.length === 0) {
      await sendMessage(ctx.chatId, 'Heute keine Klassen geplant.')
      return
    }

    const lines = rows.map((s) => {
      const ct = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
      const name = ct?.name ?? 'Session'
      const confirmedCount = (s.bookings ?? []).filter((b) => b.status === 'confirmed').length
      const d = new Date(s.starts_at)
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${hh}:${mm} · ${name} · ${confirmedCount}/${s.capacity}`
    })

    await sendMessage(ctx.chatId, `📋 Klassen heute\n\n${lines.join('\n')}`)
  },
}
