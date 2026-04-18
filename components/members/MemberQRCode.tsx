// components/members/MemberQRCode.tsx
'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface Props {
  profileId: string
}

export function MemberQRCode({ profileId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, profileId, {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#faf8f5' },
    })
  }, [profileId])

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Mein QR-Code
      </p>
      <div className="flex justify-center">
        <canvas ref={canvasRef} aria-label="Member QR Code für Check-In" />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        QR-Code beim Check-In vorzeigen
      </p>
    </div>
  )
}
