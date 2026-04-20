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

  if (rpcError) {
    console.error('[bookings] book_class RPC error:', rpcError)
    return { error: `Buchung fehlgeschlagen: ${rpcError.message}` }
  }
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

  // Atomic waitlist promotion via RPC — promotes first waitlisted and decrements
  // all remaining positions in a single transaction.
  const sessionId = cancelled[0].session_id
  let promotedProfileId: string | null = null
  if (sessionId) {
    const { data: promoted, error: rpcError } = await supabase.rpc('promote_waitlist', {
      p_session_id: sessionId,
    })
    if (rpcError) {
      console.error('[bookings] waitlist promotion failed:', rpcError)
    } else {
      promotedProfileId = promoted
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

      // Notify auto-promoted waitlist member (if any)
      if (promotedProfileId) {
        const { data: promotedProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', promotedProfileId)
          .single()
        if (promotedProfile) {
          waitUntil(notify({
            type: 'waitlist.promoted',
            data: {
              memberName: promotedProfile.full_name ?? 'Unbekannt',
              memberEmail: promotedProfile.email,
              className,
              startsAt,
            },
          }))
        }
      }
    }
  } catch {
    // best-effort
  }

  return { success: true }
}
