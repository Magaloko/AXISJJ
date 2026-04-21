'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { translations, type Lang } from '@/lib/i18n'

const STORAGE_KEY = 'axis-cookie-consent'

interface CookieBannerProps {
  lang: Lang
}

export function CookieBanner({ lang }: CookieBannerProps) {
  const [visible, setVisible] = useState(false)
  const t = translations[lang].public.cookies

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!saved) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-card p-4 shadow-2xl sm:p-5">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-foreground sm:text-sm">
          {t.text}
          {' '}
          <Link href="/impressum" className="underline hover:text-primary">{t.privacy}</Link>
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={dismiss}
            className="flex-1 border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground sm:flex-initial"
          >
            {t.ok}
          </button>
          <button
            onClick={accept}
            className="flex-1 bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 sm:flex-initial"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
