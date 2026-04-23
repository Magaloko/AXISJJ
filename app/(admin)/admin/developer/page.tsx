// app/(admin)/admin/developer/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isDeveloper, isOwnerLevel } from '@/lib/auth/roles'
import { getAllModules } from '@/lib/dashboard-modules'
import { getAllLandingSections } from '@/lib/landing-sections'
import { ModuleToggleCard } from '@/components/admin/developer/ModuleToggleCard'
import { LandingSectionToggleCard } from '@/components/admin/developer/LandingSectionToggleCard'
import { Code2, Layers, Users, Shield, Globe } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Developer Panel — AXIS' }

export default async function DeveloperPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!isOwnerLevel(profile?.role)) redirect('/admin/dashboard')

  const [modules, landingSections] = await Promise.all([
    getAllModules(),
    getAllLandingSections(),
  ])

  // Stats for the dev info card
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'member')

  const { count: coachCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'coach')

  const { count: devCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'developer' as 'member' | 'coach' | 'owner')

  const enabledCount = modules.filter(m => m.enabled).length
  const enabledSectionsCount = landingSections.filter(s => s.enabled).length

  return (
    <div className="p-6 sm:p-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-violet-500/10">
          <Code2 size={20} className="text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Developer Panel</h1>
          <p className="text-sm text-muted-foreground">Eingeloggt als {profile?.full_name ?? user.email}</p>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Users size={12} /> Mitglieder
          </div>
          <p className="font-mono text-3xl font-black text-foreground">{memberCount ?? 0}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Shield size={12} /> Coaches
          </div>
          <p className="font-mono text-3xl font-black text-foreground">{coachCount ?? 0}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Code2 size={12} /> Developer
          </div>
          <p className="font-mono text-3xl font-black text-foreground">{devCount ?? 0}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Layers size={12} /> Module aktiv
          </div>
          <p className="font-mono text-3xl font-black text-foreground">
            {enabledCount}
            <span className="text-lg text-muted-foreground">/{modules.length}</span>
          </p>
        </div>
      </div>

      {/* ── Landing Page Sections ── */}
      <div className="mb-3 flex items-center gap-2">
        <Globe size={16} className="text-primary" />
        <h2 className="text-lg font-black text-foreground">Landing Page Sektionen</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {enabledSectionsCount}/{landingSections.length} aktiv · Änderungen gelten sofort
        </span>
      </div>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {landingSections.map(sec => (
          <LandingSectionToggleCard key={sec.key} section={sec} />
        ))}
      </div>

      {/* ── Dashboard Modules ── */}
      <div className="mb-3 flex items-center gap-2">
        <Layers size={16} className="text-violet-500" />
        <h2 className="text-lg font-black text-foreground">Dashboard-Module</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Änderungen gelten sofort für alle Mitglieder
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(mod => (
          <ModuleToggleCard key={mod.key} module={mod} />
        ))}
      </div>

      {/* ── Developer notes ── */}
      <div className="mt-8 border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900 dark:bg-violet-950/20">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-500">Developer Info</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Rolle <code className="text-xs font-mono text-violet-600">developer</code> hat identische Rechte wie <code className="text-xs font-mono">owner</code> plus dieses Panel.</li>
          <li>• Rollen vergeben: <code className="text-xs font-mono">/admin/einstellungen</code> → Mitglied auswählen → Rolle ändern.</li>
          <li>• Landing-Sektionen: <code className="text-xs font-mono">landing_sections</code> Tabelle; deaktivierte Sektionen werden auf <code className="text-xs font-mono">/</code> still ausgeblendet.</li>
          <li>• Dashboard-Module: <code className="text-xs font-mono">dashboard_modules</code> Tabelle; ausgeschaltete Module verschwinden still.</li>
        </ul>
      </div>
    </div>
  )
}
