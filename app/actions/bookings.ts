'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
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
    .select('id')

  if (error) return { error: 'Stornierung fehlgeschlagen. Bitte versuche es erneut.' }
  if (!cancelled || cancelled.length === 0) return { error: 'Buchung nicht gefunden.' }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true }
}
