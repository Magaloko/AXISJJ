'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateLanguage } from '@/app/actions/profile'
import { cn } from '@/lib/utils/cn'
import type { Lang } from '@/lib/i18n'

interface Props {
  current: Lang
}

export function LanguageToggle({ current }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleChange = (lang: Lang) => {
    if (lang === current) return
    startTransition(async () => {
      const result = await updateLanguage(lang)
      if (!result.error) router.refresh()
    })
  }

  return (
    <div className="flex gap-2">
      {(['de', 'en', 'ru'] as Lang[]).map(lang => (
        <button
          key={lang}
          onClick={() => handleChange(lang)}
          disabled={isPending}
          aria-pressed={current === lang}
          className={cn(
            'border border-border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40',
            current === lang
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
