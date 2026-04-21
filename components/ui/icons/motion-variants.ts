import type { Variants, Transition } from 'framer-motion'

export type AnimateMode = 'always' | 'hover' | 'inView' | 'once' | false

export const flickerVariants: Variants = {
  animate: {
    scale: [1, 1.08, 0.96, 1.04, 1],
    opacity: [1, 0.85, 1, 0.92, 1],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: { scale: 1, opacity: 1 },
}

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.9, 1, 0.9],
    transition: {
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: { scale: 1, opacity: 1 },
}

export const floatVariants: Variants = {
  animate: {
    y: [0, -3, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: { y: 0 },
}

export const rotateShineVariants: Variants = {
  animate: {
    rotate: [0, -4, 4, -2, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  idle: { rotate: 0 },
}

export const drawOnTransition: Transition = {
  duration: 0.6,
  ease: 'easeInOut',
}

export const drawOnVariants: Variants = {
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: drawOnTransition,
  },
  idle: { pathLength: 0, opacity: 0 },
}
