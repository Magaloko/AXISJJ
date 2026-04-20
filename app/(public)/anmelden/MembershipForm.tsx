'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitMembership } from '@/app/actions/membership'
import { membershipFormSchema, type MembershipFormData } from '@/app/actions/membership.schema'
const inputClass =
  'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'
const labelClass =
  'mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground'
const errorClass = 'mt-1 text-xs text-destructive'

export default function AnmeldenPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

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
            Antrag eingegangen
          </div>
          <h1 className="mb-4 text-3xl font-black text-foreground">Danke für deine Anmeldung!</h1>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Wir haben deinen Antrag erhalten und melden uns in Kürze.
            Bitte drucke den Mitgliedsvertrag aus, unterschreibe ihn und bring ihn beim ersten Training mit.
          </p>
          <a
            href="/vertrag.pdf"
            download="AXIS_Mitgliedsvertrag.pdf"
            className="inline-block border border-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Vertrag herunterladen (PDF)
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Header */}
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
        Mitgliedschaft
      </p>
      <h1 className="mb-2 text-4xl font-black text-foreground">JETZT ANMELDEN</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        Fülle das Formular aus — wir schicken dir eine Bestätigung und bereiten alles vor.
        Den Vertrag unterschreibst du beim ersten Training.
      </p>

      {/* PDF Download */}
      <div className="mb-10 flex items-center gap-4 border border-border bg-card p-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Lieber ausdrucken?</p>
          <p className="text-xs text-muted-foreground">Leeren Vertrag herunterladen, ausfüllen und mitbringen.</p>
        </div>
        <a
          href="/vertrag.pdf"
          download="AXIS_Mitgliedsvertrag.pdf"
          className="shrink-0 border border-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          PDF Download
        </a>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Persönliche Daten */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground border-b border-border pb-2">
            Persönliche Daten
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vorname" className={labelClass}>Vorname *</label>
              <input id="vorname" {...register('vorname')} placeholder="Max" className={inputClass} />
              {errors.vorname && <p className={errorClass}>{errors.vorname.message}</p>}
            </div>
            <div>
              <label htmlFor="nachname" className={labelClass}>Nachname *</label>
              <input id="nachname" {...register('nachname')} placeholder="Mustermann" className={inputClass} />
              {errors.nachname && <p className={errorClass}>{errors.nachname.message}</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="geburtsdatum" className={labelClass}>Geburtsdatum *</label>
              <input id="geburtsdatum" type="date" {...register('geburtsdatum')} className={inputClass} />
              {errors.geburtsdatum && <p className={errorClass}>{errors.geburtsdatum.message}</p>}
            </div>
            <div>
              <label htmlFor="telefon" className={labelClass}>Telefon</label>
              <input id="telefon" type="tel" {...register('telefon')} placeholder="+43 ..." className={inputClass} />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="adresse" className={labelClass}>Adresse *</label>
            <input id="adresse" {...register('adresse')} placeholder="Musterstraße 1, 1010 Wien" className={inputClass} />
            {errors.adresse && <p className={errorClass}>{errors.adresse.message}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="email" className={labelClass}>E-Mail *</label>
            <input id="email" type="email" {...register('email')} placeholder="deine@email.at" className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>

        {/* Tarifwahl */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground border-b border-border pb-2">
            Tarifwahl
          </h2>

          <div className="mb-4">
            <p className={labelClass}>Kategorie *</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(['Erwachsene', 'Student', 'Kind'] as const).map(k => (
                <label key={k} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={k} {...register('kategorie')} className="accent-primary" />
                  <span className="text-sm text-foreground">{k}</span>
                </label>
              ))}
            </div>
            {errors.kategorie && <p className={errorClass}>{errors.kategorie.message}</p>}
          </div>

          <div>
            <p className={labelClass}>Laufzeit *</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {([
                { value: '12', label: '12 Monate' },
                { value: '6',  label: '6 Monate' },
                { value: '3',  label: '3 Monate' },
                { value: '1',  label: '1 Monat' },
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
            SEPA-Lastschrift
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Ich ermächtige Axis Jiu-Jitsu Vienna, die vereinbarten Beiträge per SEPA-Lastschrift einzuziehen.
          </p>

          <div className="mb-4">
            <label htmlFor="kontoinhaber" className={labelClass}>Kontoinhaber *</label>
            <input id="kontoinhaber" {...register('kontoinhaber')} placeholder="Vor- und Nachname" className={inputClass} />
            {errors.kontoinhaber && <p className={errorClass}>{errors.kontoinhaber.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="iban" className={labelClass}>IBAN *</label>
              <input id="iban" {...register('iban')} placeholder="AT61 1904 3002 3457 3201" className={inputClass} />
              {errors.iban && <p className={errorClass}>{errors.iban.message}</p>}
            </div>
            <div>
              <label htmlFor="bic" className={labelClass}>BIC</label>
              <input id="bic" {...register('bic')} placeholder="OPSKATWW" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Nachricht */}
        <div>
          <label htmlFor="nachricht" className={labelClass}>Nachricht / Anmerkungen</label>
          <textarea
            id="nachricht"
            {...register('nachricht')}
            rows={3}
            placeholder="Vorerfahrung, Fragen, besondere Hinweise ..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* AGB Hinweis */}
        <p className="text-xs text-muted-foreground">
          Mit dem Absenden akzeptierst du die{' '}
          <a href="/vertrag.pdf" target="_blank" className="underline hover:text-foreground">
            Allgemeinen Geschäftsbedingungen
          </a>{' '}
          von Axis Jiu-Jitsu Vienna. Mindestlaufzeit bei 12-Monats-Vertrag: 12 Monate,
          Kündigung 4 Wochen vor Ende an office@axisjj.at.
        </p>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Wird gesendet ...' : 'Antrag absenden →'}
        </button>
      </form>
    </div>
  )
}
