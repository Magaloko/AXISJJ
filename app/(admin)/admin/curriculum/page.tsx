import { isOwnerLevel } from '@/lib/auth/roles'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Curriculum | Admin' }

export default async function CurriculumListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const { data: curricula } = await supabase
    .from('curricula')
    .select('id, name, description, duration_weeks, age_group, active, updated_at')
    .order('updated_at', { ascending: false })

  const rows = curricula ?? []

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Curriculum</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Strukturierte Lehrpläne für Gi, No-Gi, Kids — jede Session mit Techniken, Quizzes, Lernaufgaben.
          </p>
        </div>
        <Link
          href="/admin/curriculum/new"
          className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Neuer Lehrplan
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-10 text-center">
          <p className="mb-2 text-base font-bold text-foreground">Noch kein Lehrplan angelegt</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Starte mit „Month 1: Foundations" — 4 Wochen, ~50 Sessions.
          </p>
          <Link
            href="/admin/curriculum/new"
            className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            <Plus size={16} />
            Ersten Lehrplan anlegen
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Zielgruppe</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dauer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    {c.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-md">
                        {c.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.age_group === 'kids' ? 'Kinder' : 'Erwachsene'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.duration_weeks} {c.duration_weeks === 1 ? 'Woche' : 'Wochen'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={
                      c.active
                        ? 'inline-block bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary'
                        : 'inline-block bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground'
                    }>
                      {c.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/curriculum/${c.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                    >
                      Bearbeiten →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
