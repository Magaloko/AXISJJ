'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

export async function bookClass(sessionId: string): Promise<{ success?: boolean; status?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt' }

  const { data: result, error: rpcError } = await supabase.rpc('book_class', {
    p_session_id: sessionId,
    p_user_id: user.id,
  })

  if (rpcError) return { error: 'Buchung fehlgeschlagen. Bitte versuche es erneut.' }
  if (result?.error) return { error: result.error }

  const status = result?.status ?? 'confirmed'

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
    const ct = Array.isArray(sessionInfo?.class_types) ? sessionInfo.class_types[0] : sessionInfo?.class_types
    const className = ct?.name ?? 'Unbekannt'
    const startsAt = sessionInfo?.starts_at ?? ''
    const memberName = memberProfile?.full_name ?? 'Unbekannt'
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
      const ct = Array.isArray(sessionInfo?.class_types) ? sessionInfo.class_types[0] : sessionInfo?.class_types
      const className = ct?.name ?? 'Unbekannt'
      const startsAt = sessionInfo?.starts_at ?? ''
      const memberName = memberProfile?.full_name ?? 'Unbekannt'
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
