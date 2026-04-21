'use client'

import * as React from 'react'
import { motion, useReducedMotion, type SVGMotionProps, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  flickerVariants,
  pulseVariants,
  floatVariants,
  rotateShineVariants,
  drawOnVariants,
  type AnimateMode,
} from './motion-variants'

interface AnimatedIconProps extends Omit<SVGMotionProps<SVGSVGElement>, 'animate'> {
  size?: number
  animate?: AnimateMode
  className?: string
  'aria-label'?: string
}

const useAnimateProps = (animate: AnimateMode) => {
  const prefersReduced = useReducedMotion()

  if (prefersReduced || animate === false || animate === undefined) {
    return { animate: 'idle' as const }
  }
  if (animate === 'hover') return { animate: 'idle' as const, whileHover: 'animate' as const }
  if (animate === 'inView') return { animate: 'idle' as const, whileInView: 'animate' as const }
  if (animate === 'once') return { animate: 'animate' as const, initial: 'idle' as const }
  return { animate: 'animate' as const }
}

interface AnimatedIconBaseProps extends AnimatedIconProps {
  variants: Variants
  transformOrigin?: string
  children: React.ReactNode
}

const AnimatedIconBase = React.forwardRef<SVGSVGElement, AnimatedIconBaseProps>(
  (
    {
      size = 24,
      animate,
      variants,
      transformOrigin = 'center',
      className,
      children,
      'aria-label': ariaLabel,
      style,
      ...props
    },
    ref,
  ) => {
    const motionProps = useAnimateProps(animate ?? false)
    const ariaProps = ariaLabel
      ? { role: 'img' as const, 'aria-label': ariaLabel }
      : { 'aria-hidden': true as const }

    return (
      <motion.svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('text-primary', className)}
        variants={variants}
        style={{ transformOrigin, ...(style as object) }}
        {...ariaProps}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.svg>
    )
  },
)
AnimatedIconBase.displayName = 'AnimatedIconBase'

// 🔥 Flame Icon — flickering
export const FlameIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'always', ...props }, ref) => (
    <AnimatedIconBase
      ref={ref}
      animate={animate}
      variants={flickerVariants}
      transformOrigin="center bottom"
      {...props}
    >
      <path
        d="M12 2c1 3 3 4.5 3 7.5 0 1.5-.8 2.5-1.5 3 .3-1.2-.2-2.5-1-3 0 2-1.5 3-1.5 5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-4c0-3.5-2.5-5-3-8-.5-1.5-1-3-3-4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M10 13c-1 1-1.5 2-1.5 3.5 0 2 1.5 3.5 3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </AnimatedIconBase>
  ),
)
FlameIcon.displayName = 'FlameIcon'

// ⚡ Lightning Icon — pulse with glow
export const LightningIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'hover', ...props }, ref) => (
    <AnimatedIconBase ref={ref} animate={animate} variants={pulseVariants} {...props}>
      <path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </AnimatedIconBase>
  ),
)
LightningIcon.displayName = 'LightningIcon'

// 🏆 Trophy Icon — gentle rotate with shine
export const TrophyIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'inView', ...props }, ref) => (
    <AnimatedIconBase ref={ref} animate={animate} variants={rotateShineVariants} {...props}>
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4z"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M7 6H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M17 6h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path
        d="M10 14h4v3h2l-1 4H9l-1-4h2v-3z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </AnimatedIconBase>
  ),
)
TrophyIcon.displayName = 'TrophyIcon'

// 🥇🥈🥉 Medal Icon — shine sweep (uses SMIL, not framer-motion)
interface MedalIconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  size?: number
  place?: 1 | 2 | 3
  animate?: boolean
  className?: string
}

const MEDAL_COLORS: Record<1 | 2 | 3, { body: string; ring: string }> = {
  1: { body: '#FFC93C', ring: '#F59E0B' },
  2: { body: '#D1D5DB', ring: '#9CA3AF' },
  3: { body: '#D97706', ring: '#92400E' },
}

const MEDAL_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Platz 1 · Gold',
  2: 'Platz 2 · Silber',
  3: 'Platz 3 · Bronze',
}

export const MedalIcon = React.forwardRef<SVGSVGElement, MedalIconProps>(
  ({ size = 24, place = 1, animate = true, className, ...props }, ref) => {
    const safePlace: 1 | 2 | 3 = place >= 1 && place <= 3 ? (place as 1 | 2 | 3) : 1
    const colors = MEDAL_COLORS[safePlace]
    const gradientId = React.useId()
    const prefersReduced = useReducedMotion()
    const shouldAnimate = !prefersReduced && animate

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn(className)}
        role="img"
        aria-label={MEDAL_LABELS[safePlace]}
        {...props}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.body} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={0.8} />
            <stop offset="100%" stopColor={colors.body} />
            {shouldAnimate && (
              <animate attributeName="x1" values="-1;1;-1" dur="2.4s" repeatCount="indefinite" />
            )}
          </linearGradient>
        </defs>
        <path
          d="M8 3h8l-2 6h-4L8 3z"
          fill={colors.ring}
          stroke={colors.ring}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <circle cx="12" cy="15" r="6" fill={`url(#${gradientId})`} stroke={colors.ring} strokeWidth={1.5} />
        <text
          x="12"
          y="17.5"
          textAnchor="middle"
          fontSize="6"
          fontWeight="bold"
          fill={colors.ring}
          fontFamily="monospace"
        >
          {safePlace}
        </text>
      </svg>
    )
  },
)
MedalIcon.displayName = 'MedalIcon'

// ✓ Check Icon — draw-on stroke
export const AnimatedCheckIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ size = 24, animate = 'once', className, 'aria-label': ariaLabel, ...props }, ref) => {
    const motionProps = useAnimateProps(animate)
    const ariaProps = ariaLabel
      ? { role: 'img' as const, 'aria-label': ariaLabel }
      : { 'aria-hidden': true as const }

    return (
      <motion.svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('text-primary', className)}
        {...ariaProps}
        {...props}
      >
        <motion.circle cx="12" cy="12" r="10" strokeWidth={1.5} variants={drawOnVariants} {...motionProps} />
        <motion.polyline points="7 12 11 16 17 9" variants={drawOnVariants} {...motionProps} />
      </motion.svg>
    )
  },
)
AnimatedCheckIcon.displayName = 'AnimatedCheckIcon'

// 🎯 Target Icon — pulse (hover)
export const TargetIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'hover', ...props }, ref) => (
    <AnimatedIconBase ref={ref} animate={animate} variants={pulseVariants} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </AnimatedIconBase>
  ),
)
TargetIcon.displayName = 'TargetIcon'

// 💪 Flex/Strength Icon — float
export const StrengthIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'hover', ...props }, ref) => (
    <AnimatedIconBase ref={ref} animate={animate} variants={floatVariants} {...props}>
      <path
        d="M5 11c0-1.5 1-2.5 2.5-2.5C9 8.5 10 9.5 10 11v5c0 2 2 3 3.5 3s2.5-1 3-2.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 14c2 0 3-1.5 3-3.5 0-2.5-2-4.5-5-4.5-2 0-3 1-4 2"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity={0.15}
      />
    </AnimatedIconBase>
  ),
)
StrengthIcon.displayName = 'StrengthIcon'

// 🥋 Gi Icon (animated) — subtle float
export const AnimatedGiIcon = React.forwardRef<SVGSVGElement, AnimatedIconProps>(
  ({ animate = 'hover', ...props }, ref) => (
    <AnimatedIconBase ref={ref} animate={animate} variants={floatVariants} {...props}>
      <path
        d="M6 4l3-2h6l3 2v4l-2 2v10h-3v-6h-2v6H8V10L6 8V4z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M12 4v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
    </AnimatedIconBase>
  ),
)
AnimatedGiIcon.displayName = 'AnimatedGiIcon'
