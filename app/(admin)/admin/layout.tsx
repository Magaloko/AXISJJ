// app/(admin)/admin/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'
import { resolveLang } from '@/lib/i18n/resolve-lang'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, language')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (!role || !['coach', 'owner'].includes(role)) {
    redirect('/dashboard')
  }

  const displayName = profile?.full_name ?? user.email ?? 'Admin'
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, profile?.language)

  return (
    <div className="min-h-screen bg-background">
      <AdminNav role={role as 'coach' | 'owner'} userName={displayName} currentLang={lang} />
      <div className="lg:ml-60">
        <main className="min-h-screen pb-20 pt-0 lg:pb-4">{children}</main>
      </div>
    </div>
  )
}
