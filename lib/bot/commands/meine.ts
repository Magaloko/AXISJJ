import type { Command } from '../router'
import { sendMessage, answerCallbackQuery } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

const WEEKDAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

interface MyBookingRow {
  id: string
  status: string
  class_sessions: {
    id: string
    starts_at: string
    cancelled: boolean
    class_types: { name: string } | { name: string }[] | null
  } | null
}

function formatSlot(iso: string): string {
  const d = new Date(iso)
  const wd = WEEKDAYS_DE[d.getDay()] ?? ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${wd} ${hh}:${mm}`
}

/**
 * /meine — list the caller's upcoming bookings (confirmed + waitlisted),
 * each with an inline cancel button.
 */
export const meineCommand: Command = {
  name: 'meine',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx) => {
    if (!ctx.profile) {
      await sendMessage(ctx.chatId, 'Bitte verknüpfe zuerst dein Konto mit /link.')
      return
    }
    const supabase = createServiceRoleClient()
    const now = new Date()

    const { data, error } = await supabase
      .from('bookings')
      .select(
        'id, status, class_sessions!inner(id, starts_at, cancelled, class_types(name))',
      )
      .eq('profile_id', ctx.profile.id)
      .in('status', ['confirmed', 'waitlisted'])
      .gte('class_sessions.starts_at', now.toISOString())
      .eq('class_sessions.cancelled', false)
      .order('class_sessions(starts_at)', { ascending: true })

    if (error) {
      console.error('[bot/meine] query error:', error)
      await sendMessage(ctx.chatId, '⚠️ Konnte deine Buchungen nicht laden.')
      return
    }

    const rows = (data ?? []) as unknown as MyBookingRow[]
    if (rows.length === 0) {
      await sendMessage(
        ctx.chatId,
        'Keine offenen Buchungen. Mit /buchen kannst du dich eintragen.',
      )
      return
    }

    const buttons = rows.map((b) => {
      const session = b.class_sessions
      if (!session) return null
      const ct = Array.isArray(session.class_types) ? session.class_types[0] : session.class_types
      const name = ct?.name ?? 'Kurs'
      const statusTag = b.status === 'waitlisted' ? ' 📋' : ''
      return [
        {
          text: `✕ ${formatSlot(session.starts_at)} · ${name}${statusTag}`,
          callback_data: `/cancel ${b.id}`,
        },
      ]
    }).filter((x): x is NonNullable<typeof x> => x !== null)

    await sendMessage(
      ctx.chatId,
      '📅 Deine Buchungen — tippe zum Stornieren:',
      { reply_markup: { inline_keyboard: buttons } },
    )
  },
}

/**
 * /cancel <bookingId> — callback-driven or typed. Cancels the caller's
 * own booking via the service-role client, verifying profile_id match
 * first so a bot user can never cancel someone else's booking.
 */
export const cancelCommand: Command = {
  name: 'cancel',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx, update) => {
    if (!ctx.profile) {
      await sendMessage(ctx.chatId, 'Bitte verknüpfe zuerst dein Konto mit /link.')
      return
    }
    const raw = update.message?.text ?? update.callback_query?.data ?? ''
    const match = raw.match(/^\/cancel\s+([a-f0-9-]{8,})/i)
    const bookingId = match?.[1]
    const cbqId = update.callback_query?.id

    if (!bookingId) {
      if (cbqId) await answerCallbackQuery(cbqId, 'Fehler')
      await sendMessage(ctx.chatId, 'Nutzung: /cancel <bookingId> oder tippe einen Button aus /meine.')
      return
    }

    const supabase = createServiceRoleClient()
    // Guard: only cancel if this booking belongs to the caller.
    const { data: owner } = await supabase
      .from('bookings')
      .select('id, session_id')
      .eq('id', bookingId)
      .eq('profile_id', ctx.profile.id)
      .maybeSingle()

    if (!owner) {
      if (cbqId) await answerCallbackQuery(cbqId, 'Nicht gefunden')
      await sendMessage(ctx.chatId, '⚠️ Buchung nicht gefunden oder nicht deine.')
      return
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', waitlist_position: null })
      .eq('id', bookingId)
      .eq('profile_id', ctx.profile.id)

    if (error) {
      console.error('[bot/cancel] update error:', error)
      if (cbqId) await answerCallbackQuery(cbqId, 'Fehler')
      await sendMessage(ctx.chatId, `⚠️ Stornierung fehlgeschlagen: ${error.message}`)
      return
    }

    // Best-effort waitlist promotion — mirrors the website action.
    if (owner.session_id) {
      await supabase.rpc('promote_waitlist', { p_session_id: owner.session_id })
    }

    if (cbqId) await answerCallbackQuery(cbqId, 'Storniert')
    await sendMessage(ctx.chatId, '✅ Buchung storniert.')
  },
}
