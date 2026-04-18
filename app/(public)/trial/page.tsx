// app/(public)/trial/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitTrialLead } from '@/app/actions/leads'
import { LeadSchema, type LeadFormData } from '@/app/actions/leads.schema'

export default function TrialPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({ resolver: zodResolver(LeadSchema) })

  const onSubmit = async (data: LeadFormData) => {
    setServerError('')
    const result = await submitTrialLead(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 inline-block border border-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Danke!
          </div>
          <h1 className="mb-4 text-3xl font-black text-foreground">Wir melden uns bald!</h1>
          <p className="text-muted-foreground">
            Deine Anmeldung ist eingegangen. Unser Team kontaktiert dich innerhalb von 24 Stunden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Kostenlos testen · Free Trial
        </p>
        <h1 className="mb-2 text-4xl font-black text-foreground">1 WOCHE GRATIS</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Keine Anmeldegebühr · Keine Verpflichtung
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Name *
            </label>
            <input
              id="full_name"
              {...register('full_name')}
              placeholder="Dein vollständiger Name"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="deine@email.at"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Telefon (optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+43 ..."
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nachricht (optional)
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={3}
              placeholder="Vorerfahrung, Fragen ..."
              className="w-full resize-none border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet ...' : 'Jetzt Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}
