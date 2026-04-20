import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CurriculumForm } from '@/components/admin/CurriculumForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Neuer Lehrplan | Admin' }

export default async function NewCurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <Link
          href="/admin/curriculum"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Zurück
        </Link>
        <h1 className="mt-2 text-2xl font-black text-foreground">Neuer Lehrplan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grundgerüst anlegen — Tracks (Gi, No-Gi, Kids …) und Sessions fügst du im nächsten Schritt hinzu.
        </p>
      </div>

      <div className="max-w-xl border border-border bg-card p-6">
        <CurriculumForm />
      </div>
    </div>
  )
}
