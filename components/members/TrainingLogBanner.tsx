'use client'

import { useState } from 'react'
import { TrainingLogDrawer } from './TrainingLogDrawer'

interface Props {
  sessionId: string | null
}

export function TrainingLogBanner({ sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <>
      <div className="mb-6 flex items-center justify-between border border-primary/30 bg-primary/5 px-5 py-4">
        <div>
          <p className="text-sm font-black text-foreground">🥋 Du warst heute im Training!</p>
          <p className="text-xs text-muted-foreground">Wie war es? Logge deine Session.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Später
          </button>
          <button
            onClick={() => setOpen(true)}
            className="bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Jetzt loggen →
          </button>
        </div>
      </div>

      {open && (
        <TrainingLogDrawer
          sessionId={sessionId}
          onClose={() => setOpen(false)}
          onSuccess={() => setDismissed(true)}
        />
      )}
    </>
  )
}
