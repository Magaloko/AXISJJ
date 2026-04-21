import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme, fonts } from '../theme'

export const Hero: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const eyebrow = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 110 } })
  const h1 = spring({ frame: frame - 16, fps, config: { damping: 14, stiffness: 110 } })
  const sub = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 110 } })

  const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        fontFamily: fonts.sans,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          color: theme.primary,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          marginBottom: 40,
          opacity: eyebrow,
          transform: `translateY(${interpolate(eyebrow, [0, 1], [16, 0])}px)`,
        }}
      >
        AXIS · Jiu-Jitsu
      </div>

      <div
        style={{
          color: theme.fg,
          fontSize: 140,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 0.95,
          textAlign: 'center',
          opacity: h1,
          transform: `translateY(${interpolate(h1, [0, 1], [24, 0])}px)`,
        }}
      >
        Deine
        <br />
        <span
          style={{
            background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Plattform
        </span>
        <br />
        auf einen Blick
      </div>

      <div
        style={{
          marginTop: 48,
          color: theme.muted,
          fontSize: 34,
          lineHeight: 1.35,
          textAlign: 'center',
          maxWidth: 780,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
        }}
      >
        Mitglied. Coach. Owner. Alles in einer App.
      </div>
    </AbsoluteFill>
  )
}
