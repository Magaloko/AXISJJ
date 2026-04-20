import { ReportGenerator } from '@/components/admin/ReportGenerator'
import { assertStaff } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Bericht generieren | Admin' }

export default async function NewReportPage() {
  const auth = await assertStaff()
  if ('error' in auth) redirect('/login')

  return (
    <div className="max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest">Trainingsbericht</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fotos auswählen (optional), kurz beschreiben was im Training passiert ist, und ein
          fertiger deutscher Bericht inklusive Instagram-Caption wird generiert. Der Bericht wird
          aktuell nicht gespeichert — einfach kopieren und dort einfügen, wo du ihn brauchst.
        </p>
      </div>
      <ReportGenerator />
    </div>
  )
}
