import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSiteTheme } from '@/lib/site-theme.server'
import { ThemeEditor } from '@/components/admin/ThemeEditor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Website-Theme | Developer' }

export default async function DeveloperThemePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = (profile as { role?: string } | null)?.role
  if (role !== 'developer' && role !== 'owner') redirect('/admin/dashboard')

  const theme = await getSiteTheme()

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-500">Developer</p>
        <h1 className="mt-1 text-2xl font-black text-foreground">Website-Theme</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Passe die Farben der Website an dein Gym-Branding an. Änderungen sind sofort live
          auf allen öffentlichen Seiten und im Admin-Panel.
        </p>
      </div>
      <ThemeEditor initial={theme} />
    </div>
  )
}
