// app/(public)/trial/page.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLead } from '@/app/actions/leads'

const schema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function TrialPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const result = await createLead(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <div className="mb-4 inline-block rounded-full border border-red-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
            Danke!
          </div>
          <h1 className="mb-4 text-3xl font-black text-white">Wir melden uns bald!</h1>
          <p className="text-gray-400">
            Deine Anmeldung ist eingegangen. Unser Team kontaktiert dich innerhalb von 24 Stunden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
          Kostenlos testen · Free Trial
        </p>
        <h1 className="mb-2 text-4xl font-black text-white">1 WOCHE GRATIS</h1>
        <p className="mb-8 text-sm text-gray-500">
          Keine Anmeldegebühr · Keine Verpflichtung
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Name *
            </label>
            <input
              id="full_name"
              {...register('full_name')}
              placeholder="Dein vollständiger Name"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="deine@email.at"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Telefon (optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+43 ..."
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              Nachricht (optional)
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={3}
              placeholder="Vorerfahrung, Fragen ..."
              className="w-full resize-none border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-500">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet ...' : 'Jetzt Anmelden →'}
          </button>
        </form>
      </div>
    </div>
  )
}
