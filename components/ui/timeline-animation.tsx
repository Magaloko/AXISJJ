'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import * as React from 'react'

interface TimelineContentProps {
  as?: keyof React.JSX.IntrinsicElements
  animationNum: number
  timelineRef: React.RefObject<HTMLElement | null>
  customVariants: Variants
  className?: string
  children: React.ReactNode
}

/**
 * Wrapper that triggers a scroll-into-view animation for its children.
 * The `animationNum` controls which custom variant index is used so that
 * a group of elements within the same `timelineRef` can stagger their
 * reveal times.
 */
export function TimelineContent({
  as = 'div',
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const inView = useInView(timelineRef, { once: true, amount: 0.1 })
  const MotionTag = motion[as as 'div'] as typeof motion.div
  return (
    <MotionTag
      custom={animationNum}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={customVariants}
      className={className}
    >
      {children}
    </MotionTag>
  )
}
