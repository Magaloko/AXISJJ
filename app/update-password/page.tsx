// app/update-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('Passwort muss mindestens 8 Zeichen lang sein.')
      setStatus('error')
      return
    }
    if (password !== confirm) {
      setErrorMsg('Die Passwörter stimmen nicht überein.')
      setStatus('error')
      return
    }

    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg('Passwort konnte nicht aktualisiert werden. Bitte fordere einen neuen Link an.')
      setStatus('error')
      return
    }
    setStatus('success')
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1500)
  }

  if (hasSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <h2 className="mb-3 text-2xl font-black text-foreground">Link ungültig</h2>
          <p className="text-muted-foreground">
            Der Reset-Link ist abgelaufen oder wurde schon benutzt. Bitte fordere einen neuen an.
          </p>
          <a
            href="/reset-password"
            className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground underline hover:text-foreground"
          >
            Neuen Link anfordern
          </a>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-foreground">Passwort aktualisiert</h2>
          <p className="text-muted-foreground">Du wirst gleich weitergeleitet ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.jpg" alt="AXIS JIU JITSU" width={56} height={56} className="object-contain" />
        </div>
        <h1 className="mb-1 text-center text-2xl font-black text-foreground">Neues Passwort</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Wähle ein neues Passwort (mindestens 8 Zeichen).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Neues Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Passwort bestätigen
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Wird gespeichert ...' : 'Passwort speichern →'}
          </button>
        </form>
      </div>
    </div>
  )
}
