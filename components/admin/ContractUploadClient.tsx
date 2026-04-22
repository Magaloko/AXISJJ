'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Sparkles, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { extractContractData, createMemberFromContract } from '@/app/actions/contract-ocr'
import type { ExtractedMemberData } from '@/app/actions/contract-ocr'

type Step = 'upload' | 'extracting' | 'review' | 'creating' | 'done'

const inputClass = 'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'
const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground'

export function ContractUploadClient() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)

  // Form state (review step)
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')

  async function processFile(file: File) {
    setError('')

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setError('Nur Bilder (JPG, PNG, WEBP) werden unterstützt. Bitte konvertiere das PDF zuerst.')
      return
    }

    setStep('extracting')

    // Read as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Strip data:image/...;base64, prefix
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const res = await extractContractData(base64, file.type as any)
    if (res.error || !res.data) {
      setError(res.error ?? 'Extraktion fehlgeschlagen.')
      setStep('upload')
      return
    }

    const d = res.data
    setVorname(d.vorname ?? '')
    setNachname(d.nachname ?? '')
    setEmail(d.email ?? '')
    setPhone(d.phone ?? '')
    setDob(d.date_of_birth ?? '')
    setStep('review')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!vorname.trim() && !nachname.trim()) { setError('Mindestens Vor- oder Nachname ist erforderlich.'); return }
    if (!email.trim()) { setError('E-Mail ist erforderlich.'); return }

    setStep('creating')
    const res = await createMemberFromContract({
      full_name: `${vorname.trim()} ${nachname.trim()}`.trim(),
      email: email.trim(),
      phone: phone || null,
      date_of_birth: dob || null,
    })

    if (res.error) {
      setError(res.error)
      setStep('review')
      return
    }

    setCreatedId(res.profileId ?? null)
    setStep('done')
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <div className="max-w-md">
        <div className="flex flex-col items-center gap-4 border border-border bg-card p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-primary bg-primary/10">
            <Check size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">Mitglied angelegt!</h2>
          <p className="text-sm text-muted-foreground">
            {vorname} {nachname} wurde erfolgreich als Mitglied registriert.<br />
            Eine Einladungs-E-Mail wurde an {email} gesendet.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setError('') }}
              className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted"
            >
              Weiteren Vertrag
            </button>
            {createdId && (
              <button
                onClick={() => router.push('/admin/mitglieder')}
                className="bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
              >
                Zu Mitgliedern →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Extracting ──
  if (step === 'extracting') {
    return (
      <div className="flex max-w-md flex-col items-center gap-4 border border-border bg-card p-12 text-center">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center bg-primary/10">
          <Sparkles size={24} className="text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground">KI liest den Vertrag aus …</p>
        <p className="text-xs text-muted-foreground">Einen Moment Geduld.</p>
      </div>
    )
  }

  // ── Review form ──
  if (step === 'review' || step === 'creating') {
    return (
      <form onSubmit={handleCreate} className="max-w-lg space-y-4">
        <div className="mb-2 flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-3">
          <Sparkles size={14} className="text-primary" />
          <p className="text-xs text-primary">Bitte überprüfe die ausgelesenen Daten vor dem Anlegen.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Vorname *</label>
            <input value={vorname} onChange={e => setVorname(e.target.value)} className={inputClass} placeholder="Max" />
          </div>
          <div>
            <label className={labelClass}>Nachname *</label>
            <input value={nachname} onChange={e => setNachname(e.target.value)} className={inputClass} placeholder="Mustermann" />
          </div>
        </div>

        <div>
          <label className={labelClass}>E-Mail *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="max@email.at" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Telefon</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+43 …" />
          </div>
          <div>
            <label className={labelClass}>Geburtsdatum</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStep('upload'); setError('') }}
            className="border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={step === 'creating'}
            className="flex-1 bg-primary py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {step === 'creating' ? 'Mitglied wird angelegt …' : 'Mitglied anlegen →'}
          </button>
        </div>
      </form>
    )
  }

  // ── Upload ──
  return (
    <div className="max-w-lg">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-4 border-2 border-dashed p-12 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center bg-muted">
          <Upload size={28} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Vertrag hier ablegen oder klicken</p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG oder WEBP · max. 10 MB</p>
          <p className="mt-1 text-xs text-muted-foreground">PDFs bitte vorher als Bild exportieren (z.B. Screenshot)</p>
        </div>
        <div className="flex items-center gap-2 border border-border bg-card px-4 py-2">
          <FileText size={14} className="text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Datei auswählen</span>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Die KI liest Vor- und Nachname, E-Mail, Telefon und Geburtsdatum aus. Du kannst alle Felder vor dem Anlegen überprüfen und korrigieren.
      </p>
    </div>
  )
}
