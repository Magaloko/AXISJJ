import { getMyActiveSubscription } from '@/app/actions/subscriptions'

const CATEGORY_LABELS = { students: 'Student', adults: 'Erwachsene', kids: 'Kinder' }

export async function MySubscriptionCard() {
  const sub = await getMyActiveSubscription()

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Mein Abo</p>

      {!sub ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Noch kein Abo hinterlegt.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sprich uns einfach an oder <a href="/anmelden" className="font-bold text-primary hover:underline">komplettiere deine Anmeldung</a>.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-lg font-black text-foreground">
            {CATEGORY_LABELS[sub.category]}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sub.duration_months} Monate · {Number(sub.price_per_month).toFixed(0)} €/Monat
          </p>

          <div className="mt-4 border-t border-border pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span className="font-mono text-foreground">
                {new Date(sub.start_date).toLocaleDateString('de-AT')}
              </span>
            </div>
            {sub.end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ende</span>
                <span className="font-mono text-foreground">
                  {new Date(sub.end_date).toLocaleDateString('de-AT')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-primary">Aktiv</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
