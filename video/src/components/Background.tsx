import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { theme } from '../theme'

export const Background: React.FC = () => {
  const frame = useCurrentFrame()

  const orbX1 = interpolate(frame, [0, 300, 600, 900], [0, 120, -60, 0])
  const orbY1 = interpolate(frame, [0, 450, 900], [0, 80, 0])
  const orbX2 = interpolate(frame, [0, 450, 900], [0, -100, 0])
  const orbY2 = interpolate(frame, [0, 300, 600, 900], [0, -60, 120, 0])
  const orbX3 = interpolate(frame, [0, 450, 900], [0, 60, 0])
  const orbY3 = interpolate(frame, [0, 450, 900], [0, -120, 0])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: theme.bg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: theme.primary,
          filter: 'blur(140px)',
          opacity: 0.28,
          transform: `translate(${orbX1}px, ${orbY1}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          right: -200,
          width: 680,
          height: 680,
          borderRadius: '50%',
          background: theme.member,
          filter: 'blur(140px)',
          opacity: 0.25,
          transform: `translate(${orbX2}px, ${orbY2}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 640,
          height: 640,
          marginLeft: -320,
          marginTop: -320,
          borderRadius: '50%',
          background: theme.coach,
          filter: 'blur(140px)',
          opacity: 0.2,
          transform: `translate(${orbX3}px, ${orbY3}px)`,
        }}
      />
    </div>
  )
}
