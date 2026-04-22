'use client'

import { useEffect } from 'react'

export default function CheckinError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[checkin-page] render error:', error)
  }, [error])

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-4 text-2xl font-black text-foreground">Check-In</h1>
      <div className="border border-destructive/40 bg-destructive/5 p-4">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-destructive">
          Fehler beim Laden der Seite
        </p>
        <pre className="whitespace-pre-wrap break-words text-xs text-foreground">
          {error.message}
        </pre>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Digest: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        {error.stack && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground">Stack trace</summary>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[10px] text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="mt-4 bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
