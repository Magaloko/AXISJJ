import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { theme, fonts } from '../theme'
import { ArrowRightIcon } from '../components/Icons'

export const CTA: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoIn = spring({ frame: frame - 2, fps, config: { damping: 13, stiffness: 120 } })
  const headIn = spring({ frame: frame - 14, fps, config: { damping: 14, stiffness: 110 } })
  const subIn = spring({ frame: frame - 28, fps, config: { damping: 14, stiffness: 110 } })
  const buttonIn = spring({ frame: frame - 44, fps, config: { damping: 13, stiffness: 120 } })

  const pulse = interpolate(Math.sin((frame / 20) * Math.PI * 2), [-1, 1], [0.96, 1.04])

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 72px',
        fontFamily: fonts.sans,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: theme.primary,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          marginBottom: 24,
          opacity: logoIn,
          transform: `translateY(${interpolate(logoIn, [0, 1], [10, 0])}px)`,
        }}
      >
        AXIS · Jiu-Jitsu
      </div>

      <div
        style={{
          color: theme.fg,
          fontSize: 132,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 0.95,
          marginBottom: 28,
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [24, 0])}px)`,
        }}
      >
        Eine App.
        <br />
        <span
          style={{
            background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Alles drin.
        </span>
      </div>

      <div
        style={{
          color: theme.muted,
          fontSize: 32,
          lineHeight: 1.4,
          maxWidth: 820,
          marginBottom: 64,
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`,
        }}
      >
        Training. Community. Fortschritt.
        <br />
        Für jedes Mitglied, jeden Coach, jeden Owner.
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 18,
          padding: '26px 44px',
          borderRadius: 999,
          background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})`,
          color: '#0a0a0a',
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          boxShadow: `0 20px 60px ${theme.primary}55`,
          opacity: buttonIn,
          transform: `scale(${interpolate(buttonIn, [0, 1], [0.9, 1]) * pulse})`,
        }}
      >
        Jetzt starten
        <ArrowRightIcon size={36} color="#0a0a0a" strokeWidth={3} />
      </div>
    </AbsoluteFill>
  )
}
