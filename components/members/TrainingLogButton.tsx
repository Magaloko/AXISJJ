'use client'

import { useState } from 'react'
import { TrainingLogDrawer } from './TrainingLogDrawer'

export function TrainingLogButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        + Training loggen
      </button>
      {open && <TrainingLogDrawer sessionId={null} onClose={() => setOpen(false)} />}
    </>
  )
}
