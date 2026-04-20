'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  id: z.string().uuid(),
  price_per_month: z.number().nonnegative().max(10000),
  total_price: z.number().nonnegative().max(100000).nullable(),
  highlighted: z.boolean(),
})

export type PricingUpdate = z.infer<typeof updateSchema>

export async function updatePricingPlan(
  data: PricingUpdate,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pricing_plans')
    .update({
      price_per_month: parsed.data.price_per_month,
      total_price: parsed.data.total_price,
      highlighted: parsed.data.highlighted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)

  if (error) {
    console.error('[pricing] update error:', error)
    return { error: `Speichern fehlgeschlagen: ${error.message}` }
  }

  await logAudit({
    action: 'pricing.updated',
    targetType: 'pricing_plan',
    targetId: parsed.data.id,
    meta: { price_per_month: parsed.data.price_per_month, total_price: parsed.data.total_price, highlighted: parsed.data.highlighted },
  })

  // Invalidate public pages that show pricing
  revalidatePath('/')
  revalidatePath('/preise')
  revalidatePath('/admin/einstellungen')
  return { success: true }
}
