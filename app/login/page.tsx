// app/login/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logPasswordLogin } from '@/app/actions/auth-events'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setErrorMsg('Falls diese E-Mail registriert ist, erhältst du einen Magic Link.')
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg('Ungültige E-Mail oder Passwort.')
      setStatus('error')
    } else {
      // Fire notify in background — must not block navigation
      logPasswordLogin().catch(err => console.error('[login] notify failed:', err))
      // Hard navigation so server picks up fresh session cookies
      window.location.assign('/dashboard')
    }
  }

  if (status === 'success' && mode === 'magic') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-foreground">Check deine E-Mail</h2>
          <p className="text-muted-foreground">
            Wir haben einen Magic Link an <strong className="text-foreground">{email}</strong> gesendet.
          </p>
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
        <h1 className="mb-1 text-center text-2xl font-black text-foreground">AXIS Member Portal</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Mitglieder-Login</p>

        {/* Mode toggle */}
        <div className="mb-6 flex border border-border">
          <button
            type="button"
            onClick={() => { setMode('magic'); setStatus('idle'); setErrorMsg('') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'magic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle'); setErrorMsg('') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'password' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Passwort
          </button>
        </div>

        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
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

          {mode === 'password' && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Passwort
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline hover:text-foreground"
                >
                  Vergessen?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>
          )}

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Wird geladen ...' : mode === 'magic' ? 'Link senden →' : 'Einloggen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
