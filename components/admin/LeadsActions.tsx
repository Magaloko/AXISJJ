'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeadForm } from './LeadForm'

export function LeadsActions() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button onClick={() => setOpen(true)}
              className="bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        + NEUER LEAD
      </button>
      {open && (
        <LeadForm
          onClose={() => setOpen(false)}
          onCreated={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
