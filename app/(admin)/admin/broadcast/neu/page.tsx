// app/(admin)/admin/broadcast/neu/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BroadcastForm } from '@/components/admin/broadcast/BroadcastForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Neue Nachricht | Admin' }

export default async function NeuerBroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'developer'].includes(profile.role)) redirect('/admin/broadcast')

  const { data: groups } = await (supabase as any)
    .from('training_groups')
    .select('id, name, color')
    .order('name', { ascending: true })

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Broadcast</p>
        <h1 className="text-2xl font-black text-foreground">Neue Nachricht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle Kanal und Zielgruppe — alle Felder können vor dem Absenden geprüft werden.
        </p>
      </div>
      <BroadcastForm
        groups={(groups ?? []).map((g: any) => ({ id: g.id, name: g.name, color: g.color }))}
      />
    </div>
  )
}
