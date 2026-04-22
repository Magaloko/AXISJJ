'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'
import { assertOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getActionErrors } from '@/lib/i18n/action-lang'

export async function promoteToNextBelt(profileId: string): Promise<{
  success?: true
  newBeltName?: string
  error?: string
}> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()

  const { data: currentRank } = await supabase
    .from('profile_ranks')
    .select('belt_rank_id, belt_ranks(order, name)')
    .eq('profile_id', profileId)
    .order('promoted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const e = await getActionErrors()

  if (!currentRank) return { error: 'Kein aktueller Gürtel gefunden.' } // TODO: i18n

  const currentBelt = Array.isArray(currentRank.belt_ranks)
    ? currentRank.belt_ranks[0]
    : currentRank.belt_ranks
  if (!currentBelt) return { error: 'Gürtel-Reihenfolge ungültig.' } // TODO: i18n

  const { data: nextBelt } = await supabase
    .from('belt_ranks')
    .select('id, name')
    .gt('order', currentBelt.order)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextBelt) return { error: 'Kein höherer Gürtel verfügbar.' } // TODO: i18n

  const { error: insertError } = await supabase.from('profile_ranks').insert({
    profile_id: profileId,
    belt_rank_id: nextBelt.id,
    promoted_at: new Date().toISOString().slice(0, 10),
    promoted_by: auth.userId,
  })
  if (insertError) {
    console.error('[promotions] insert error:', insertError)
    return { error: `${e.saveFailed}: ${insertError.message}` }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/guertel')
  revalidatePath('/admin/mitglieder')

  try {
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', profileId)
      .single()
    const memberName = memberProfile?.full_name ?? 'Unbekannt'
    // Admin notification
    waitUntil(notify({
      type: 'belt.promoted',
      data: { memberName, fromBelt: currentBelt.name, toBelt: nextBelt.name },
    }))
    waitUntil(logAudit({
      action: 'belt.promoted',
      targetType: 'profile',
      targetId: profileId,
      targetName: memberName,
      meta: { fromBelt: currentBelt.name, toBelt: nextBelt.name },
    }))
    // Member notification
    if (memberProfile?.email) {
      waitUntil(notify(
        {
          type: 'member.belt_promoted',
          data: {
            memberName,
            memberEmail: memberProfile.email,
            fromBelt: currentBelt.name,
            toBelt: nextBelt.name,
          },
        },
        { targetProfileId: profileId },
      ))
    }
  } catch {
    // best-effort
  }

  return { success: true, newBeltName: nextBelt.name }
}
