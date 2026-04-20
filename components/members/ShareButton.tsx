'use client'

import { useState } from 'react'

interface Props {
  text: string
  url?: string
  label?: string
}

export function ShareButton({ text, url, label = 'Teilen' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareData = { text, url }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled or share failed; fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    const content = url ? `${text}\n${url}` : text
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
    >
      {copied ? '✓ Kopiert' : `🔗 ${label}`}
    </button>
  )
}
