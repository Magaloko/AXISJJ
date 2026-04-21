import React from 'react'
import { Composition } from 'remotion'
import { AxisAd } from './AxisAd'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="axis-ad-30"
        component={AxisAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
