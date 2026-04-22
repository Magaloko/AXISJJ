// app/(admin)/admin/vertrag-upload/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContractUploadClient } from '@/components/admin/ContractUploadClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Vertrag hochladen | Admin' }

export default async function VertragUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'developer'].includes(profile.role)) redirect('/admin/dashboard')

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Mitgliederverwaltung</p>
        <h1 className="text-2xl font-black text-foreground">Vertrag hochladen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lade einen ausgefüllten Mitgliedsvertrag hoch. Die KI liest die Daten aus und legt das Mitglied automatisch an.
        </p>
      </div>
      <ContractUploadClient />
    </div>
  )
}
