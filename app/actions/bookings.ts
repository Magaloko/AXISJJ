'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

export async function bookClass(sessionId: string): Promise<{ success?: boolean; status?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  // Check for existing non-cancelled booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('profile_id', user.id)
    .single()

  if (existing && existing.status !== 'cancelled') {
    return { error: 'Du hast diese Klasse bereits gebucht.' }
  }

  // NOTE: capacity check and insert are not atomic — concurrent requests can cause overbooking.
  // A proper fix requires a DB-level function (RPC). Acceptable for current scale.
  const [{ count: confirmedCount, error: countError }, { data: session }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'confirmed'),
    supabase
      .from('class_sessions')
      .select('capacity')
      .eq('id', sessionId)
      .single(),
  ])

  if (countError) return { error: 'Buchung fehlgeschlagen. Bitte versuche es erneut.' }
  if (!session) return { error: 'Klasse nicht gefunden.' }

  const hasSpace = (confirmedCount ?? 0) < session.capacity
  const status = hasSpace ? 'confirmed' as const : 'waitlisted' as const

  const { error } = existing
    ? await supabase
        .from('bookings')
        .update({ status, waitlist_position: hasSpace ? null : (confirmedCount ?? 0) + 1 })
        .eq('id', existing.id)
    : await supabase
        .from('bookings')
        .insert({ session_id: sessionId, profile_id: user.id, status,
          waitlist_position: hasSpace ? null : (confirmedCount ?? 0) + 1 })

  if (error) return { error: 'Buchung fehlgeschlagen. Bitte versuche es erneut.' }

  revalidatePath('/buchen')
  revalidatePath('/dashboard')

  // Fire-and-forget notification: fetch class + member details
  try {
    const [{ data: sessionInfo }, { data: memberProfile }] = await Promise.all([
      supabase
        .from('class_sessions')
        .select('starts_at, class_types(name)')
        .eq('id', sessionId)
        .single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single(),
    ])
    const classTypes = (sessionInfo as { class_types?: { name?: string } | { name?: string }[] } | null)?.class_types
    const ct = Array.isArray(classTypes) ? classTypes[0] : classTypes
    const className = ct?.name ?? 'Unbekannt'
    const startsAt = (sessionInfo as { starts_at?: string } | null)?.starts_at ?? ''
    const memberName = (memberProfile as { full_name?: string } | null)?.full_name ?? 'Unbekannt'
    waitUntil(notify({
      type: 'booking.created',
      data: { memberName, className, startsAt, status },
    }))
  } catch {
    // best-effort
  }

  return { success: true, status }
}

export async function cancelBooking(bookingId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { data: cancelled, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', waitlist_position: null })
    .eq('id', bookingId)
    .eq('profile_id', user.id)
    .select('id, session_id')

  if (error) return { error: 'Stornierung fehlgeschlagen. Bitte versuche es erneut.' }
  if (!cancelled || cancelled.length === 0) return { error: 'Buchung nicht gefunden.' }

  // Promote first waitlisted booking for this session
  const sessionId = cancelled[0].session_id
  if (sessionId) {
    const { data: firstWaitlisted } = await supabase
      .from('bookings')
      .select('id, waitlist_position')
      .eq('session_id', sessionId)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .single()

    if (firstWaitlisted) {
      const { error: promoteError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', waitlist_position: null })
        .eq('id', firstWaitlisted.id)

      if (promoteError) {
        console.error('Waitlist promotion failed:', promoteError)
      }

      // Decrement remaining waitlist positions
      // NOTE: N+1 loop acceptable at gym scale (< 20 waitlisted per session)
      const { data: remaining } = await supabase
        .from('bookings')
        .select('id, waitlist_position')
        .eq('session_id', sessionId)
        .eq('status', 'waitlisted')
        .gt('waitlist_position', 0)

      if (remaining) {
        for (const b of remaining) {
          await supabase
            .from('bookings')
            .update({ waitlist_position: b.waitlist_position! - 1 })
            .eq('id', b.id)
        }
      }
    }
  }

  revalidatePath('/buchen')
  revalidatePath('/dashboard')

  // Fire-and-forget notification
  try {
    if (sessionId) {
      const [{ data: sessionInfo }, { data: memberProfile }] = await Promise.all([
        supabase
          .from('class_sessions')
          .select('starts_at, class_types(name)')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single(),
      ])
      const classTypes = (sessionInfo as { class_types?: { name?: string } | { name?: string }[] } | null)?.class_types
      const ct = Array.isArray(classTypes) ? classTypes[0] : classTypes
      const className = ct?.name ?? 'Unbekannt'
      const startsAt = (sessionInfo as { starts_at?: string } | null)?.starts_at ?? ''
      const memberName = (memberProfile as { full_name?: string } | null)?.full_name ?? 'Unbekannt'
      waitUntil(notify({
        type: 'booking.cancelled',
        data: { memberName, className, startsAt },
      }))
    }
  } catch {
    // best-effort
  }

  return { success: true }
}
