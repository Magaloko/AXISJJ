import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { notify } from '@/lib/notifications'
import { computeStats } from '@/app/actions/training-log-stats'

/**
 * Monthly cron — sends each member a personalized summary of the previous month.
 * Scheduled: 1st of each month at 09:00 UTC via vercel.json.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Previous month boundaries
  const now = new Date()
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthLabel = prevMonthStart.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })

  // Fetch all members
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'member')

  if (membersError) {
    console.error('[cron/monthly] members query error:', membersError)
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const m of members ?? []) {
    if (!m.email) { skipped++; continue }

    // Count attendances in previous month
    const { count: trainingsCount } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', m.id)
      .gte('checked_in_at', prevMonthStart.toISOString())
      .lte('checked_in_at', prevMonthEnd.toISOString())

    const trainings = trainingsCount ?? 0

    // Compute training-log stats (streak, avg mood lift)
    const { data: logs } = await supabase
      .from('training_logs')
      .select('logged_at, mood_before, mood_after, technique, conditioning, mental, next_goal')
      .eq('profile_id', m.id)
      .order('logged_at', { ascending: false })
      .limit(100)

    const stats = computeStats(logs ?? [])

    try {
      await notify({
        type: 'monthly.report',
        data: {
          memberName: m.full_name ?? 'Mitglied',
          memberEmail: m.email,
          month: monthLabel,
          trainings,
          streak: stats.currentStreak,
          avgMoodLift: stats.avgMoodLift,
        },
      })
      sent++
    } catch (err) {
      console.error('[cron/monthly] send failed for', m.id, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, month: monthLabel })
}
