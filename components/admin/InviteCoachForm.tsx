'use client'

import { useState, useTransition } from 'react'
import { inviteCoach } from '@/app/actions/invite-coach'

export function InviteCoachForm() {
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await inviteCoach(form)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Einladung an ${form.email} gesendet. Der Coach muss in der E-Mail den Link bestätigen.` })
        setForm({ full_name: '', email: '' })
      }
    })
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Neuen Coach einladen</p>
      <p className="mb-5 text-sm text-muted-foreground">
        Sendet eine Einladungs-E-Mail. Das Profil wird direkt mit Rolle &quot;Coach&quot; angelegt.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="coach_name" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Name
          </label>
          <input
            id="coach_name"
            type="text"
            required
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Vor- und Nachname"
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="coach_email" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            E-Mail
          </label>
          <input
            id="coach_email"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="coach@example.com"
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Wird gesendet...' : 'Einladung senden →'}
        </button>
      </form>
    </div>
  )
}
