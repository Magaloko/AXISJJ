// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

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
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (status === 'success' && mode === 'magic') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-black text-white">Check deine E-Mail</h2>
          <p className="text-gray-400">
            Wir haben einen Magic Link an <strong className="text-white">{email}</strong> gesendet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/images/logo.jpg" alt="AXIS JIU JITSU" width={56} height={56} className="object-contain" />
        </div>

        <h1 className="mb-1 text-center text-2xl font-black text-white">AXIS Member Portal</h1>
        <p className="mb-8 text-center text-sm text-gray-600">Mitglieder-Login</p>

        {/* Mode toggle */}
        <div className="mb-6 flex border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('magic'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'magic' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'password' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            Passwort
          </button>
        </div>

        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="deine@email.at"
              className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-600"
              />
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-red-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Wird geladen ...'
              : mode === 'magic'
              ? 'Link senden →'
              : 'Einloggen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
