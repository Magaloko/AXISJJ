import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme, fonts } from '../theme'

interface CardProps {
  icon: React.ReactNode
  title: string
  body: string
  delay: number
  accent?: string
}

export const Card: React.FC<CardProps> = ({ icon, title, body, delay, accent = theme.primary }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.6 },
  })

  const opacity = interpolate(appear, [0, 1], [0, 1], { extrapolateRight: 'clamp' })
  const translateY = interpolate(appear, [0, 1], [40, 0], { extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 28,
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        opacity,
        transform: `translateY(${translateY}px)`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.35)`,
        fontFamily: fonts.sans,
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: `${accent}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
        }}
      >
        {icon}
      </div>
      <div style={{ color: theme.fg, fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
        {title}
      </div>
      <div style={{ color: theme.muted, fontSize: 22, lineHeight: 1.4 }}>{body}</div>
    </div>
  )
}
