'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { submitMembership } from '@/app/actions/membership'
import { validateDiscountCode } from '@/app/actions/discount-codes'
import { membershipFormSchema, type MembershipFormData } from '@/app/actions/membership.schema'
import { translations, type Lang } from '@/lib/i18n'

const inputClass =
  'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'
const labelClass =
  'mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground'
const errorClass = 'mt-1 text-xs text-destructive'

interface MembershipFormProps {
  lang: Lang
}

export default function MembershipForm({ lang }: MembershipFormProps) {
  const t = translations[lang].public.membershipForm
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  // Discount code state
  const [discountInput, setDiscountInput] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [discountLabel, setDiscountLabel] = useState<string | null>(null)
  const [discountError, setDiscountError] = useState('')

  async function handleDiscountCheck() {
    if (!discountInput.trim()) return
    setDiscountValidating(true)
    setDiscountError('')
    setDiscountLabel(null)
    const res = await validateDiscountCode(discountInput)
    setDiscountValidating(false)
    if (res.valid && res.discount_label) {
      setDiscountLabel(res.discount_label)
    } else {
      setDiscountError(res.error ?? 'Ungültiger Code.')
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MembershipFormData>({ resolver: zodResolver(membershipFormSchema) })

  const onSubmit = async (data: MembershipFormData) => {
    setServerError('')
    const result = await submitMembership(data)
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
            {t.successBadge}
          </div>
          <h1 className="mb-4 text-3xl font-black text-foreground">{t.successHeading}</h1>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            {t.successText}
          </p>
          <a
            href="/vertrag.pdf"
            download="AXIS_Mitgliedsvertrag.pdf"
            className="inline-block border border-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {t.successDownload}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
        {t.eyebrow}
      </p>
      <h1 className="mb-2 text-4xl font-black text-foreground">{t.heading}</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        {t.intro}
      </p>
      <p className="mb-6 text-xs text-muted-foreground">
        Bereits Mitglied?{' '}
        <Link href="/login" className="font-bold text-primary underline hover:text-primary/80">
          Hier einloggen →
        </Link>
        {' '}· Probetraining?{' '}
        <Link href="/trial" className="font-bold text-primary underline hover:text-primary/80">
          1 Woche gratis →
        </Link>
      </p>

      {/* PDF Download */}
      <div className="mb-10 flex items-center gap-4 border border-border bg-card p-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{t.printHeading}</p>
          <p className="text-xs text-muted-foreground">{t.printText}</p>
        </div>
        <a
          href="/vertrag.pdf"
          download="AXIS_Mitgliedsvertrag.pdf"
          className="shrink-0 border border-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {t.printButton}
        </a>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Data */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground border-b border-border pb-2">
            {t.personalSection}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vorname" className={labelClass}>{t.firstName}</label>
              <input id="vorname" {...register('vorname')} placeholder={t.firstNamePlaceholder} className={inputClass} />
              {errors.vorname && <p className={errorClass}>{errors.vorname.message}</p>}
            </div>
            <div>
              <label htmlFor="nachname" className={labelClass}>{t.lastName}</label>
              <input id="nachname" {...register('nachname')} placeholder={t.lastNamePlaceholder} className={inputClass} />
              {errors.nachname && <p className={errorClass}>{errors.nachname.message}</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="geburtsdatum" className={labelClass}>{t.birthDate}</label>
              <input id="geburtsdatum" type="date" {...register('geburtsdatum')} className={inputClass} />
              {errors.geburtsdatum && <p className={errorClass}>{errors.geburtsdatum.message}</p>}
            </div>
            <div>
              <label htmlFor="telefon" className={labelClass}>{t.phone}</label>
              <input id="telefon" type="tel" {...register('telefon')} placeholder={t.phonePlaceholder} className={inputClass} />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="adresse" className={labelClass}>{t.address}</label>
            <input id="adresse" {...register('adresse')} placeholder={t.addressPlaceholder} className={inputClass} />
            {errors.adresse && <p className={errorClass}>{errors.adresse.message}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="email" className={labelClass}>{t.email}</label>
            <input id="email" type="email" {...register('email')} placeholder={t.emailPlaceholder} className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>

        {/* Tariff */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground border-b border-border pb-2">
            {t.tariffSection}
          </h2>

          <div className="mb-4">
            <p className={labelClass}>{t.category}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {([
                { value: 'Erwachsene', label: t.catAdults },
                { value: 'Student',    label: t.catStudent },
                { value: 'Kind',       label: t.catKids },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={value} {...register('kategorie')} className="accent-primary" />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
            {errors.kategorie && <p className={errorClass}>{errors.kategorie.message}</p>}
          </div>

          <div>
            <p className={labelClass}>{t.duration}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {([
                { value: '12', label: t.dur12 },
                { value: '6',  label: t.dur6 },
                { value: '3',  label: t.dur3 },
                { value: '1',  label: t.dur1 },
              ] as const).map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={value} {...register('laufzeit')} className="accent-primary" />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
            {errors.laufzeit && <p className={errorClass}>{errors.laufzeit.message}</p>}
          </div>
        </div>

        {/* SEPA */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground border-b border-border pb-2">
            {t.sepaSection}
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {t.sepaLegal}
          </p>

          <div className="mb-4">
            <label htmlFor="kontoinhaber" className={labelClass}>{t.accountHolder}</label>
            <input id="kontoinhaber" {...register('kontoinhaber')} placeholder={t.accountHolderPlaceholder} className={inputClass} />
            {errors.kontoinhaber && <p className={errorClass}>{errors.kontoinhaber.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="iban" className={labelClass}>{t.iban}</label>
              <input id="iban" {...register('iban')} placeholder={t.ibanPlaceholder} className={inputClass} />
              {errors.iban && <p className={errorClass}>{errors.iban.message}</p>}
            </div>
            <div>
              <label htmlFor="bic" className={labelClass}>{t.bic}</label>
              <input id="bic" {...register('bic')} placeholder={t.bicPlaceholder} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="nachricht" className={labelClass}>{t.notesLabel}</label>
          <textarea
            id="nachricht"
            {...register('nachricht')}
            rows={3}
            placeholder={t.notesPlaceholder}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Discount Code */}
        <div>
          <label className={labelClass}>Rabatt-Code (optional)</label>
          <div className="flex gap-0">
            <input
              value={discountInput}
              onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountLabel(null); setDiscountError('') }}
              placeholder="AXIS-XXXXXX"
              className="flex-1 border border-border bg-card px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleDiscountCheck}
              disabled={discountValidating || !discountInput.trim()}
              className="border border-l-0 border-border px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              {discountValidating ? '…' : 'Prüfen'}
            </button>
          </div>
          {discountLabel && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={14} />
              <span className="font-bold">{discountLabel} wird angewendet!</span>
            </div>
          )}
          {discountError && <p className="mt-1 text-xs text-destructive">{discountError}</p>}
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          {t.termsLegal}
        </p>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  )
}
