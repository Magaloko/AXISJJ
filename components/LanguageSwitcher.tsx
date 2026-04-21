'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { updateLanguage } from '@/app/actions/profile'
import { LANG_META, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

interface Props {
  currentLang: Lang
  variant?: 'compact' | 'full'
  className?: string
}

export function LanguageSwitcher({ currentLang, variant = 'compact', className }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function select(lang: Lang) {
    if (lang === currentLang) { setOpen(false); return }
    setOpen(false)
    startTransition(async () => {
      await updateLanguage(lang)
      router.refresh()
    })
  }

  const current = LANG_META[currentLang]
  const languages = Object.entries(LANG_META) as [Lang, typeof LANG_META[Lang]][]

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        aria-label="Sprache wechseln"
        className={cn(
          'flex items-center gap-2 text-sm transition-opacity',
          variant === 'compact' && 'px-2 py-1.5 border border-border hover:bg-muted',
          variant === 'full' && 'w-full px-3 py-2 border border-border hover:bg-muted',
          isPending && 'opacity-50',
        )}
      >
        {variant === 'compact' ? (
          <>
            <span className="text-base leading-none" aria-hidden>{current.flag}</span>
            <span className="text-xs font-bold uppercase tracking-wider">{currentLang}</span>
          </>
        ) : (
          <>
            <Globe size={16} />
            <span className="flex-1 text-left">{current.nativeName}</span>
            <span className="text-xs text-muted-foreground">{current.flag}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[160px] border border-border bg-card shadow-lg">
          {languages.map(([code, meta]) => (
            <button
              key={code}
              onClick={() => select(code)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-muted',
                code === currentLang && 'bg-primary/10 text-primary font-semibold',
              )}
            >
              <span className="text-base leading-none" aria-hidden>{meta.flag}</span>
              <span className="flex-1">{meta.nativeName}</span>
              {code === currentLang && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
