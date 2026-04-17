'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bookClass(sessionId: string): Promise<{ success?: boolean; status?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

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

  // Check capacity
  const [{ count: confirmedCount }, { data: session }] = await Promise.all([
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

  const hasSpace = (confirmedCount ?? 0) < (session?.capacity ?? 20)
  const status = hasSpace ? 'confirmed' as const : 'waitlisted' as const

  let error
  if (existing) {
    // Re-activate a cancelled booking
    ;({ error } = await supabase
      .from('bookings')
      .update({ status, waitlist_position: hasSpace ? null : (confirmedCount ?? 0) + 1 })
      .eq('id', existing.id))
  } else {
    ;({ error } = await supabase
      .from('bookings')
      .insert({ session_id: sessionId, profile_id: user.id, status }))
  }

  if (error) return { error: 'Buchung fehlgeschlagen. Bitte versuche es erneut.' }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true, status }
}

export async function cancelBooking(bookingId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', waitlist_position: null })
    .eq('id', bookingId)
    .eq('profile_id', user.id)

  if (error) return { error: 'Stornierung fehlgeschlagen. Bitte versuche es erneut.' }

  revalidatePath('/members/buchen')
  revalidatePath('/members/dashboard')
  return { success: true }
}
