import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LeadsKanban, type Lead } from '@/components/admin/LeadsKanban'
import { LeadsListView } from '@/components/admin/LeadsListView'
import { LeadsActions } from '@/components/admin/LeadsActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leads | Admin' }

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const params = await searchParams
  const view = params.view === 'list' ? 'list' : 'kanban'

  const { data } = await supabase
    .from('leads')
    .select('id, full_name, email, source, status, created_at')
    .order('created_at', { ascending: false })

  const leads = (data ?? []) as Lead[]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-4 text-2xl font-black text-foreground">Leads</h1>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <Link href="/admin/leads?view=kanban"
                className={`px-3 py-1.5 text-xs font-bold ${view === 'kanban' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
            KANBAN
          </Link>
          <Link href="/admin/leads?view=list"
                className={`px-3 py-1.5 text-xs font-bold ${view === 'list' ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'}`}>
            LISTE
          </Link>
        </div>
        <LeadsActions />
      </div>
      {view === 'kanban' ? <LeadsKanban initialLeads={leads} /> : <LeadsListView leads={leads} />}
    </div>
  )
}
