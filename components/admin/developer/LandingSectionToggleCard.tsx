'use client'

import { useState, useTransition } from 'react'
import { toggleLandingSection } from '@/app/actions/developer'
import type { LandingSection } from '@/lib/landing-sections'
import { cn } from '@/lib/utils/cn'

interface Props {
  section: LandingSection
}

export function LandingSectionToggleCard({ section: sec }: Props) {
  const [enabled, setEnabled] = useState(sec.enabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await toggleLandingSection(sec.key, next)
      if (!result.success) setEnabled(!next)
    })
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border p-4 transition-colors',
        enabled ? 'border-border bg-card' : 'border-border bg-muted/40',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-bold', enabled ? 'text-foreground' : 'text-muted-foreground')}>
          {sec.label}
        </p>
        {sec.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{sec.description}</p>
        )}
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">{sec.key}</p>
      </div>

      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${sec.label} ${enabled ? 'deaktivieren' : 'aktivieren'}`}
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          enabled ? 'bg-primary' : 'bg-muted',
          isPending && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
