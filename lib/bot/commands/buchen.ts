import type { Command } from '../router'
import { sendMessage, answerCallbackQuery } from '../telegram-api'
import { createServiceRoleClient } from '@/lib/supabase/service'

const WEEKDAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

interface SessionRow {
  id: string
  starts_at: string
  capacity: number
  class_types: { name: string; gi: boolean } | { name: string; gi: boolean }[] | null
  bookings: { id: string; profile_id: string; status: string }[] | null
}

function formatSlot(iso: string): string {
  const d = new Date(iso)
  const wd = WEEKDAYS_DE[d.getDay()] ?? ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${wd} ${hh}:${mm}`
}

/**
 * /buchen — list next 14 days of active sessions the caller hasn't already
 * booked, as inline-keyboard "Book" buttons. Tapping a button dispatches
 * `/book <sessionId>` through the existing router.
 */
export const buchenCommand: Command = {
  name: 'buchen',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx) => {
    if (!ctx.profile) {
      await sendMessage(ctx.chatId, 'Bitte verknüpfe zuerst dein Konto mit /link.')
      return
    }
    const supabase = createServiceRoleClient()
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('class_sessions')
      .select(
        'id, starts_at, capacity, class_types(name, gi), bookings(id, profile_id, status)',
      )
      .eq('cancelled', false)
      .gte('starts_at', now.toISOString())
      .lte('starts_at', windowEnd.toISOString())
      .order('starts_at', { ascending: true })
      .limit(30)

    if (error) {
      console.error('[bot/buchen] query error:', error)
      await sendMessage(ctx.chatId, '⚠️ Konnte Klassen nicht laden.')
      return
    }

    const rows = (data ?? []) as SessionRow[]
    // Filter out sessions the caller already booked (non-cancelled).
    const eligible = rows.filter((s) => {
      const bookings = Array.isArray(s.bookings) ? s.bookings : []
      return !bookings.some(
        (b) => b.profile_id === ctx.profile!.id && b.status !== 'cancelled',
      )
    })

    if (eligible.length === 0) {
      await sendMessage(
        ctx.chatId,
        'Keine offenen Klassen in den nächsten 14 Tagen oder du hast bereits alle gebucht.',
      )
      return
    }

    // Build up to 12 inline buttons, one row per session.
    const buttons = eligible.slice(0, 12).map((s) => {
      const ct = Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
      const name = ct?.name ?? 'Kurs'
      const giTag = ct?.gi ? 'Gi' : 'NoGi'
      const confirmedCount = (s.bookings ?? []).filter((b) => b.status === 'confirmed').length
      return [
        {
          text: `${formatSlot(s.starts_at)} · ${name} (${giTag}) · ${confirmedCount}/${s.capacity}`,
          callback_data: `/book ${s.id}`,
        },
      ]
    })

    await sendMessage(
      ctx.chatId,
      '🗓 Nächste Klassen — tippe zum Buchen:',
      { reply_markup: { inline_keyboard: buttons } },
    )
  },
}

/**
 * /book <sessionId> — handler invoked either by typed command or by an
 * inline-keyboard button from /buchen. Delegates to the same
 * `book_class` RPC the website uses so capacity + waitlist logic is
 * identical.
 */
export const bookCommand: Command = {
  name: 'book',
  allowedRoles: ['admin', 'moderator', 'coach', 'member'],
  handler: async (ctx, update) => {
    if (!ctx.profile) {
      await sendMessage(ctx.chatId, 'Bitte verknüpfe zuerst dein Konto mit /link.')
      return
    }
    const raw = update.message?.text ?? update.callback_query?.data ?? ''
    const match = raw.match(/^\/book\s+([a-f0-9-]{8,})/i)
    const sessionId = match?.[1]
    const cbqId = update.callback_query?.id

    if (!sessionId) {
      if (cbqId) await answerCallbackQuery(cbqId, 'Fehler')
      await sendMessage(ctx.chatId, 'Nutzung: /book <sessionId> oder tippe einen Button aus /buchen.')
      return
    }

    const supabase = createServiceRoleClient()
    const { data: result, error } = await supabase.rpc('book_class', {
      p_session_id: sessionId,
      p_user_id: ctx.profile.id,
    })

    if (error) {
      console.error('[bot/book] rpc error:', error)
      if (cbqId) await answerCallbackQuery(cbqId, 'Fehler')
      await sendMessage(ctx.chatId, `⚠️ Buchung fehlgeschlagen: ${error.message}`)
      return
    }
    if (result?.error) {
      if (cbqId) await answerCallbackQuery(cbqId, result.error)
      await sendMessage(ctx.chatId, `⚠️ ${result.error}`)
      return
    }

    const status = result?.status ?? 'confirmed'
    const msg = status === 'waitlisted'
      ? '📋 Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.'
      : '✅ Gebucht! Viel Spaß auf der Matte.'
    if (cbqId) await answerCallbackQuery(cbqId, status === 'waitlisted' ? 'Warteliste' : 'Gebucht')
    await sendMessage(ctx.chatId, msg)
  },
}
