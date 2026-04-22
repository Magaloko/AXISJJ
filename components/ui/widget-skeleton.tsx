interface Props {
  label?: string
  rows?: number
  className?: string
}

/**
 * Placeholder used inside a <Suspense> boundary or as a loading card for a
 * member dashboard widget. Matches the visual shell of a real widget so the
 * layout does not shift when data arrives.
 */
export function WidgetSkeleton({ label, rows = 4, className }: Props) {
  return (
    <div
      className={`border border-border bg-card p-6 ${className ?? ''}`}
      aria-busy="true"
      aria-live="polite"
    >
      {label ? (
        <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      ) : (
        <div className="mb-5 h-4 w-28 animate-pulse bg-muted" />
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse bg-muted" />
            </div>
            <div className="h-4 w-10 animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
