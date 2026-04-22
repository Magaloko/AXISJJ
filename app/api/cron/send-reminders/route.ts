import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { notify } from '@/lib/notifications'

/**
 * Daily cron job — called by Vercel Cron at 10:00 UTC (~11:00 Vienna winter / 12:00 summer).
 * Sends reminder emails to members with confirmed bookings for sessions starting
 * in the next 20–28 hours (window allows for run-time jitter).
 *
 * Secured via CRON_SECRET env var (Vercel sets Authorization: Bearer <secret>).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  const now = new Date()
  const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000) // +20h
  const windowEnd   = new Date(now.getTime() + 28 * 60 * 60 * 1000) // +28h

  const { data: sessions, error } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, location,
      class_types(name),
      bookings!inner(profile_id, status)
    `)
    .eq('cancelled', false)
    .eq('bookings.status', 'confirmed')
    .gte('starts_at', windowStart.toISOString())
    .lte('starts_at', windowEnd.toISOString())

  if (error) {
    console.error('[cron/send-reminders] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let remindersSent = 0
  let remindersFailed = 0

  for (const session of sessions ?? []) {
    const classType = Array.isArray(session.class_types) ? session.class_types[0] : session.class_types
    const className = classType?.name ?? 'Training'
    const bookings = Array.isArray(session.bookings) ? session.bookings : []
    const profileIds = bookings.map(b => b.profile_id)

    if (profileIds.length === 0) continue

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)

    for (const profile of profiles ?? []) {
      if (!profile.email) continue
      try {
        await notify(
          {
            type: 'training.reminder',
            data: {
              memberName: profile.full_name ?? 'Mitglied',
              memberEmail: profile.email,
              className,
              startsAt: session.starts_at,
              location: session.location,
            },
          },
          { targetProfileId: profile.id },
        )
        remindersSent++
      } catch (err) {
        console.error('[cron/send-reminders] failed for profile', profile.id, err)
        remindersFailed++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sessionsChecked: sessions?.length ?? 0,
    remindersSent,
    remindersFailed,
  })
}
