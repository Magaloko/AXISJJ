import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme, fonts } from '../theme'
import { Card } from '../components/Card'

export interface RoleCardData {
  icon: React.ReactNode
  title: string
  body: string
}

interface RoleSectionProps {
  role: 'member' | 'coach' | 'owner'
  eyebrow: string
  heading: string
  accent: string
  cards: RoleCardData[]
}

export const RoleSection: React.FC<RoleSectionProps> = ({ role, eyebrow, heading, accent, cards }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const headIn = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 110 } })
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 64px',
        fontFamily: fonts.sans,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          marginBottom: 24,
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [16, 0])}px)`,
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          color: theme.fg,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 0.95,
          textAlign: 'center',
          marginBottom: 56,
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [24, 0])}px)`,
        }}
      >
        {heading}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 28,
          width: '100%',
          maxWidth: 920,
        }}
      >
        {cards.map((c, i) => (
          <Card
            key={`${role}-${i}`}
            icon={c.icon}
            title={c.title}
            body={c.body}
            delay={18 + i * 8}
            accent={accent}
          />
        ))}
      </div>
    </AbsoluteFill>
  )
}
