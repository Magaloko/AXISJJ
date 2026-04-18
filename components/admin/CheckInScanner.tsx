// components/admin/CheckInScanner.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { checkIn } from '@/app/actions/checkin'

interface Props {
  sessionId: string
  onCheckedIn: (profileId: string) => void
}

type ScanResult =
  | { type: 'success'; memberName: string }
  | { type: 'error'; message: string }
  | null

export function CheckInScanner({ sessionId, onCheckedIn }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const lastScannedRef = useRef<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          tick()
        }
      } catch {
        setCameraError('Kamera konnte nicht gestartet werden.')
      }
    }

    function tick() {
      if (!active) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code && code.data && code.data !== lastScannedRef.current) {
        lastScannedRef.current = code.data
        handleScan(code.data)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    startCamera()

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [sessionId])

  async function handleScan(profileId: string) {
    const result = await checkIn(profileId, sessionId)
    if (result.success && result.memberName) {
      setScanResult({ type: 'success', memberName: result.memberName })
      onCheckedIn(profileId)
    } else {
      setScanResult({ type: 'error', message: result.error ?? 'Fehler beim Check-In.' })
    }
    // Reset after 2s to allow next scan
    setTimeout(() => {
      setScanResult(null)
      lastScannedRef.current = null
    }, 2000)
  }

  return (
    <div className="relative overflow-hidden rounded-sm bg-black">
      <video ref={videoRef} className="h-64 w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* QR frame overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-sm border-2 border-primary opacity-80" />
      </div>

      {/* Hint */}
      {!scanResult && !cameraError && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold text-white/80">
          QR-Code scannen
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-center text-sm text-red-400 px-4">
          {cameraError}
        </div>
      )}

      {/* Scan result flash */}
      {scanResult && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-4 text-center ${
            scanResult.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'
          }`}
        >
          <p className="text-lg font-black text-white">
            {scanResult.type === 'success'
              ? `✓ ${scanResult.memberName}`
              : '✗ Fehler'}
          </p>
          {scanResult.type === 'error' && (
            <p className="mt-1 text-sm text-white/80">{scanResult.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
