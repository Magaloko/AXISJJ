// app/reset-password/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    if (error) {
      // Don't leak whether the email is registered.
      setStatus('success')
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <h2 className="mb-3 text-2xl font-black text-foreground">Check deine E-Mail</h2>
          <p className="text-muted-foreground">
            Falls <strong className="text-foreground">{email}</strong> registriert ist, haben wir dir
            einen Link zum Zurücksetzen deines Passworts geschickt.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground underline hover:text-foreground"
          >
            ← Zurück zum Login
          </Link>
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
        <h1 className="mb-1 text-center text-2xl font-black text-foreground">Passwort zurücksetzen</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Gib deine E-Mail ein. Wir schicken dir einen Link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="deine@email.at"
              className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Wird gesendet ...' : 'Link senden →'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline hover:text-foreground"
            >
              ← Zurück zum Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
