import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  label?: string
  title?: string
  description: ReactNode
  action?: {
    href: string
    text: string
  }
  className?: string
}

/**
 * Consistent empty-state card used when a dashboard widget has no data yet.
 * Keeps the visual weight of a real widget so the grid does not collapse and
 * invites the member toward a next action.
 */
export function EmptyStateCard({ label, title, description, action, className }: Props) {
  return (
    <div className={`border border-border bg-card p-6 ${className ?? ''}`}>
      {label && (
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      )}
      {title && <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>}
      <p className="text-sm text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80"
        >
          {action.text}
        </Link>
      )}
    </div>
  )
}
