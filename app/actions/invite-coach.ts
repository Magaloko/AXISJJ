'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'

const inviteCoachSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail'),
})

export type InviteCoachInput = z.infer<typeof inviteCoachSchema>

export async function inviteCoach(
  data: InviteCoachInput,
): Promise<{ success?: true; error?: string }> {
  const parsed = inviteCoachSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const admin = createServiceRoleClient()

  // Invite the user via Supabase Auth; this sends a magic-link email.
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.full_name },
    },
  )

  if (inviteError) {
    console.error('[invite-coach] invite error:', inviteError)
    // If user already exists, try to promote existing profile to coach
    if (inviteError.message.toLowerCase().includes('already') ||
        inviteError.message.toLowerCase().includes('registered')) {
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('email', parsed.data.email)
        .single()
      if (existing) {
        const { error: updateError } = await admin
          .from('profiles')
          .update({ role: 'coach', full_name: parsed.data.full_name })
          .eq('id', existing.id)
        if (updateError) return { error: `Profil-Update fehlgeschlagen: ${updateError.message}` }
        revalidatePath('/admin/einstellungen')
        revalidatePath('/admin/mitglieder')
        return { success: true }
      }
      return { error: 'E-Mail bereits registriert, aber kein Profil gefunden.' }
    }
    return { error: `Einladung fehlgeschlagen: ${inviteError.message}` }
  }

  if (!inviteData.user) return { error: 'Kein User erstellt.' }

  // Create or update profile with coach role
  const { error: profileError } = await admin.from('profiles').upsert({
    id: inviteData.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: 'coach',
    language: 'de',
  })

  if (profileError) {
    console.error('[invite-coach] profile error:', profileError)
    return { error: `Profil-Erstellung fehlgeschlagen: ${profileError.message}` }
  }

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/mitglieder')
  return { success: true }
}
