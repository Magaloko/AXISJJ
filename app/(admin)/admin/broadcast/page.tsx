// app/(admin)/admin/broadcast/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listBroadcasts } from '@/app/actions/broadcast'
import { listDiscountCodes } from '@/app/actions/discount-codes'
import { BroadcastDashboardClient } from '@/components/admin/broadcast/BroadcastDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Broadcast | Admin' }

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'developer'].includes(profile.role)) redirect('/admin/dashboard')

  // Load training groups for targeting
  const { data: groups } = await (supabase as any)
    .from('training_groups')
    .select('id, name, color')
    .order('name', { ascending: true })

  const [broadcasts, codes] = await Promise.all([
    listBroadcasts(),
    listDiscountCodes(),
  ])

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Broadcast-Center</h1>
          <p className="text-sm text-muted-foreground">Nachrichten an Mitglieder via E-Mail und Telegram</p>
        </div>
        <Link
          href="/admin/broadcast/neu"
          className="flex items-center gap-2 bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground"
        >
          + Neue Nachricht
        </Link>
      </div>

      <BroadcastDashboardClient
        broadcasts={broadcasts}
        codes={codes}
        groups={(groups ?? []).map((g: any) => ({ id: g.id, name: g.name, color: g.color }))}
      />
    </div>
  )
}
