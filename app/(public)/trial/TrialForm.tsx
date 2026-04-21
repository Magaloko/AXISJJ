'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitTrialLead } from '@/app/actions/leads'
import { LeadSchema, type LeadFormData } from '@/app/actions/leads.schema'
import { translations, type Lang } from '@/lib/i18n'

interface TrialFormProps {
  lang: Lang
}

export default function TrialForm({ lang }: TrialFormProps) {
  const t = translations[lang].public.trial
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
            {t.thanks}
          </div>
          <h1 className="mb-4 text-3xl font-black text-foreground">{t.confirmationHeading}</h1>
          <p className="text-muted-foreground">
            {t.confirmationText}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {t.eyebrow}
        </p>
        <h1 className="mb-2 text-4xl font-black text-foreground">{t.heading}</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.labelName}
            </label>
            <input
              id="full_name"
              {...register('full_name')}
              placeholder={t.placeholderName}
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.labelEmail}
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder={t.placeholderEmail}
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.labelPhone}
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder={t.placeholderPhone}
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.labelMessage}
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={3}
              placeholder={t.placeholderMessage}
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
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
