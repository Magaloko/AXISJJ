import { createServiceRoleClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export interface AuditEvent {
  action: string
  targetType?: string
  targetId?: string
  targetName?: string
  meta?: Record<string, unknown>
}

/**
 * Log an action to the audit_log table. Uses the service-role client to
 * bypass RLS for insert. Resolves the actor from the current auth session.
 * Best-effort — logs console error on failure but never throws.
 */
export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let actorName: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      actorName = profile?.full_name ?? null
    }

    const admin = createServiceRoleClient()
    await admin.from('audit_log').insert({
      actor_id:    user?.id ?? null,
      actor_name:  actorName,
      action:      event.action,
      target_type: event.targetType ?? null,
      target_id:   event.targetId ?? null,
      target_name: event.targetName ?? null,
      meta:        event.meta ? JSON.parse(JSON.stringify(event.meta)) : null,
    })
  } catch (err) {
    console.error('[audit] failed to log event:', event.action, err)
  }
}
