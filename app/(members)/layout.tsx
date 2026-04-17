// app/(members)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/members/MemberNav'

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email ?? 'Member'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MemberNav userName={displayName} />
      <div className="lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  )
}
