// app/(members)/layout.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MemberNav } from '@/components/members/MemberNav'
import { resolveLang } from '@/lib/i18n/resolve-lang'

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, language')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email ?? 'Member'
  const rawLang = (await cookies()).get('lang')?.value
  const lang = resolveLang(rawLang, profile?.language)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MemberNav userName={displayName} lang={lang} />
      <div className="lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  )
}
