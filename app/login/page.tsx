// app/login/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logPasswordLogin } from '@/app/actions/auth-events'
import { Dumbbell, BadgeCheck } from 'lucide-react'

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
      logPasswordLogin().catch(err => console.error('[login] notify failed:', err))
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.jpg" alt="AXIS JIU JITSU" width={56} height={56} className="object-contain" />
        </div>

        {/* Heading */}
        <div className="mb-2 inline-block border border-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          Einloggen
        </div>
        <h1 className="mb-1 text-2xl font-black text-foreground">Willkommen zurück</h1>
        <p className="mb-8 text-sm text-muted-foreground">Melde dich in deinem AXIS Mitglieder-Account an.</p>

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

        {/* Divider */}
        <div className="my-8 flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Noch kein Mitglied?</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Registration options */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/trial"
            className="group flex flex-col gap-2 border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <Dumbbell size={20} className="text-primary" />
            <p className="text-xs font-black uppercase tracking-wide text-foreground">1 Woche gratis</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Probetraining buchen — kostenlos & unverbindlich</p>
            <span className="mt-auto text-[10px] font-bold uppercase tracking-wider text-primary group-hover:underline">
              Jetzt starten →
            </span>
          </Link>

          <Link
            href="/anmelden"
            className="group flex flex-col gap-2 border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <BadgeCheck size={20} className="text-primary" />
            <p className="text-xs font-black uppercase tracking-wide text-foreground">Mitglied werden</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Abo abschließen & Teil der Community werden</p>
            <span className="mt-auto text-[10px] font-bold uppercase tracking-wider text-primary group-hover:underline">
              Anmelden →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
