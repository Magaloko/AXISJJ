// app/(admin)/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (!role || !['coach', 'owner'].includes(role)) {
    redirect('/dashboard')
  }

  const displayName = profile?.full_name ?? user.email ?? 'Admin'

  return (
    <div className="min-h-screen bg-background">
      <AdminNav role={role as 'coach' | 'owner'} userName={displayName} />
      <div className="lg:ml-60">
        <main className="min-h-screen pb-4 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}
