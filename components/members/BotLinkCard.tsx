'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateBotLinkCode, unlinkBotAccount } from '@/app/actions/bot-link'
import { Send, Unlink, Copy, CheckCheck } from 'lucide-react'
import { AnimatedCheckIcon } from '@/components/ui/icons/animated-icons'

interface Props {
  isLinked: boolean
  telegramUsername: string | null
}

export function BotLinkCard({ isLinked, telegramUsername }: Props) {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateBotLinkCode()
      if (result.error) { setError(result.error); return }
      setCode(result.code ?? null)
    })
  }

  function handleUnlink() {
    if (!confirm('Telegram-Verknüpfung wirklich lösen?')) return
    setError(null)
    startTransition(async () => {
      const result = await unlinkBotAccount()
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function copyCode() {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deepLink = code ? `https://t.me/AXISJJ_Bot?start=link_${code}` : null

  return (
    <div className="mt-6 border border-border bg-card p-6">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <Send size={14} className="text-primary" strokeWidth={2} />
        Telegram-Verknüpfung
      </p>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {isLinked ? (
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm">
            <AnimatedCheckIcon size={16} animate="once" className="text-primary" />
            Verknüpft {telegramUsername && <>als <span className="font-mono">@{telegramUsername}</span></>}
          </p>
          <button
            onClick={handleUnlink}
            disabled={isPending}
            className="flex items-center gap-2 border border-border px-3 py-1.5 text-xs font-bold text-destructive disabled:opacity-50"
          >
            <Unlink size={14} /> Lösen
          </button>
        </div>
      ) : code ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Dein Link-Code (gültig 15 Min):
          </p>
          <div className="mb-4 flex items-center gap-3 border border-border bg-background p-4">
            <span className="flex-1 font-mono text-2xl font-black tracking-widest text-primary">
              {code}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 border border-border px-2 py-1 text-xs font-bold"
            >
              {copied ? <><CheckCheck size={14} /> Kopiert</> : <><Copy size={14} /> Kopieren</>}
            </button>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>1. Öffne Telegram und finde <a href="https://t.me/AXISJJ_Bot" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">@AXISJJ_Bot</a></p>
            <p>2. Sende: <span className="font-mono bg-muted px-1">/link {code}</span></p>
            <p className="pt-2">Oder direkt: <a href={deepLink!} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">Link in Telegram öffnen →</a></p>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Verknüpfe dein Konto mit unserem Telegram-Bot um Training zu buchen, QR-Code anzuzeigen, und mehr.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Link-Code erzeugen
          </button>
        </div>
      )}
    </div>
  )
}
