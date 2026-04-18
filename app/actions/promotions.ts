'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

export async function promoteToNextBelt(profileId: string): Promise<{
  success?: true
  newBeltName?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Nicht eingeloggt.' }

  const { data: caller, error: callerError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (callerError || caller?.role !== 'owner') return { error: 'Keine Berechtigung.' }

  const { data: currentRank } = await supabase
    .from('profile_ranks')
    .select('belt_rank_id, belt_ranks(order, name)')
    .eq('profile_id', profileId)
    .order('promoted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!currentRank) return { error: 'Kein aktueller Gürtel gefunden.' }

  const currentBelt = Array.isArray(currentRank.belt_ranks)
    ? currentRank.belt_ranks[0]
    : currentRank.belt_ranks
  const currentOrder = (currentBelt as { order: number } | null)?.order
  const currentBeltName = (currentBelt as { name?: string } | null)?.name ?? 'Unbekannt'
  if (currentOrder === undefined || currentOrder === null) {
    return { error: 'Gürtel-Reihenfolge ungültig.' }
  }

  const { data: nextBelt } = await supabase
    .from('belt_ranks')
    .select('id, name')
    .gt('order', currentOrder)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextBelt) return { error: 'Kein höherer Gürtel verfügbar.' }

  const { error: insertError } = await (supabase.from('profile_ranks') as any).insert({
    profile_id: profileId,
    belt_rank_id: (nextBelt as { id: string }).id,
    promoted_at: new Date().toISOString().slice(0, 10),
    promoted_by: user.id,
  })
  if (insertError) return { error: 'Promotion fehlgeschlagen.' }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/guertel')
  revalidatePath('/admin/mitglieder')

  const newBeltName = (nextBelt as { name: string }).name

  // Fire-and-forget notification: fetch member name
  try {
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', profileId)
      .single()
    const memberName = (memberProfile as { full_name?: string } | null)?.full_name ?? 'Unbekannt'
    waitUntil(notify({
      type: 'belt.promoted',
      data: { memberName, fromBelt: currentBeltName, toBelt: newBeltName },
    }))
  } catch {
    // best-effort
  }

  return { success: true, newBeltName }
}
