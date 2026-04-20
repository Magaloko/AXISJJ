import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { notify } from '@/lib/notifications'

/**
 * Daily cron — sends birthday email to members whose birthday is today.
 * Scheduled: 09:30 UTC daily.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, date_of_birth')
    .not('date_of_birth', 'is', null)

  if (error) {
    console.error('[cron/birthdays] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const today = new Date()
  const todayMM = today.getMonth() + 1
  const todayDD = today.getDate()

  let sent = 0, failed = 0
  for (const p of profiles ?? []) {
    if (!p.date_of_birth || !p.email) continue
    const [y, m, d] = p.date_of_birth.split('-').map(Number)
    if (m !== todayMM || d !== todayDD) continue

    const age = today.getFullYear() - y
    try {
      await notify({
        type: 'birthday.wish',
        data: {
          memberName: p.full_name ?? 'Mitglied',
          memberEmail: p.email,
          age,
        },
      })
      sent++
    } catch (err) {
      console.error('[cron/birthdays] send failed for', p.id, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, date: `${todayDD}.${todayMM}` })
}
