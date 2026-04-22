'use client'

/**
 * MagicBento — React/Next.js port of the vue-bits.dev Magic Bento.
 * Pure CSS + React hooks — no GSAP required.
 *
 * Grid layout: 1 col (mobile) → 2 col (sm) → 4 col (lg)
 * Each <BentoTile> gets:
 *   - colSpan / rowSpan props for grid placement
 *   - cursor-following border glow
 *   - radial spotlight overlay
 *   - optional particle stars on hover
 */

import { useRef, useCallback, useEffect, useState, type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils/cn'

/* ───────── types ───────── */

export interface BentoTileProps {
  children: ReactNode
  className?: string
  /** Grid column span at lg breakpoint (1–4), default 1 */
  colSpan?: 1 | 2 | 3 | 4
  /** Grid row span, default 1 */
  rowSpan?: 1 | 2
  /** RGB glow color, default '220 38 38' (primary red) */
  glowColor?: string
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  enableStars?: boolean
}

export interface BentoGridProps {
  children: ReactNode
  className?: string
}

/* ───────── grid container ───────── */

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ───────── col/row span class maps ───────── */

const colSpanClass: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
}
const rowSpanClass: Record<number, string> = {
  1: '',
  2: 'lg:row-span-2',
}
const smColSpanClass: Record<number, string> = {
  1: '',
  2: 'sm:col-span-2',
  3: 'sm:col-span-2',
  4: 'sm:col-span-2',
}

/* ───────── star particle ───────── */

interface Star { id: number; x: number; y: number; delay: number; size: number }

function useStars(count = 8) {
  const [stars, setStars] = useState<Star[]>([])
  const spawnStars = useCallback((x: number, y: number) => {
    setStars(
      Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        delay: i * 80,
        size: 3 + Math.random() * 3,
      })),
    )
    setTimeout(() => setStars([]), count * 80 + 600)
  }, [count])
  return { stars, spawnStars }
}

/* ───────── tile ───────── */

export function BentoTile({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  glowColor = '220 38 38',
  enableSpotlight = true,
  enableBorderGlow = true,
  enableStars = false,
}: BentoTileProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { stars, spawnStars } = useStars()

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pctX = Math.round((x / rect.width) * 100)
    const pctY = Math.round((y / rect.height) * 100)
    el.style.setProperty('--glow-x', `${pctX}%`)
    el.style.setProperty('--glow-y', `${pctY}%`)
    el.style.setProperty('--glow-opacity', '1')
  }, [])

  const handleMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--glow-opacity', '0')
  }, [])

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (enableStars) {
      const rect = ref.current?.getBoundingClientRect()
      if (rect) spawnStars(e.clientX - rect.left, e.clientY - rect.top)
    }
  }, [enableStars, spawnStars])

  const style: CSSProperties & Record<string, string> = {
    '--glow-color': glowColor,
    '--glow-x': '50%',
    '--glow-y': '50%',
    '--glow-opacity': '0',
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={style}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200',
        /* grid placement */
        colSpanClass[colSpan],
        rowSpanClass[rowSpan],
        smColSpanClass[colSpan],
        /* subtle lift on hover */
        'hover:-translate-y-0.5 hover:shadow-lg',
        className,
      )}
    >
      {/* border glow layer */}
      {enableBorderGlow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: 'var(--glow-opacity)',
            background: `radial-gradient(180px circle at var(--glow-x) var(--glow-y), rgb(var(--glow-color) / 0.25), transparent 70%)`,
            zIndex: 0,
          }}
        />
      )}

      {/* spotlight overlay */}
      {enableSpotlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: 'var(--glow-opacity)',
            background: `radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgb(255 255 255 / 0.04), transparent 70%)`,
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />
      )}

      {/* star particles */}
      {stars.map(star => (
        <span
          key={star.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-primary/70 animate-ping"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}ms`,
            animationDuration: '500ms',
            zIndex: 2,
          }}
        />
      ))}

      {/* content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
