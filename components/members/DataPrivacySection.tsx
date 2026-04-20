'use client'

import { useState, useTransition } from 'react'
import { exportMyData } from '@/app/actions/data-export'
import { deleteMyAccount } from '@/app/actions/delete-account'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DataPrivacySection() {
  const [showDelete, setShowDelete] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDownload() {
    setMessage(null)
    startTransition(async () => {
      const result = await exportMyData()
      if ('error' in result) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Download gestartet.' })
    })
  }

  function handleDelete() {
    setMessage(null)
    startTransition(async () => {
      const result = await deleteMyAccount({ confirmation })
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      // Sign out + redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    })
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Datenschutz & DSGVO
        </p>
        <p className="text-xs text-muted-foreground">
          Laut DSGVO hast du das Recht, deine bei uns gespeicherten Daten jederzeit einzusehen oder deinen Account zu löschen.
        </p>
      </div>

      {/* Data Download */}
      <div className="border border-border bg-card p-4">
        <p className="mb-1 text-sm font-bold text-foreground">Meine Daten herunterladen</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Lade eine JSON-Datei mit all deinen gespeicherten Daten herunter (Profil, Buchungen, Check-Ins, Training-Logs, Wettkämpfe).
        </p>
        <button
          onClick={handleDownload}
          disabled={isPending}
          className="border border-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {isPending ? 'Lade...' : 'Daten als JSON exportieren'}
        </button>
      </div>

      {/* Account Deletion */}
      <div className="border border-destructive/30 bg-destructive/5 p-4">
        <p className="mb-1 text-sm font-bold text-destructive">Account löschen</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Dein Account und alle zugehörigen Daten werden unwiderruflich gelöscht.
          Trainingsstatistiken, Buchungen und Fortschritt können nicht wiederhergestellt werden.
        </p>

        {!showDelete ? (
          <button
            onClick={() => { setShowDelete(true); setMessage(null) }}
            className="border border-destructive px-4 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-white transition-colors"
          >
            Account löschen...
          </button>
        ) : (
          <div className="space-y-3 rounded border border-destructive bg-background p-3">
            <p className="text-xs font-semibold text-destructive">
              Zur Bestätigung tippe exakt: <code className="font-mono">ACCOUNT LÖSCHEN</code>
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              placeholder="ACCOUNT LÖSCHEN"
              className="w-full border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-destructive"
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending || confirmation !== 'ACCOUNT LÖSCHEN'}
                className="flex-1 bg-destructive py-2 text-xs font-bold text-white disabled:opacity-50 hover:opacity-90"
              >
                {isPending ? 'Lösche...' : 'Endgültig löschen'}
              </button>
              <button
                onClick={() => { setShowDelete(false); setConfirmation(''); setMessage(null) }}
                className="flex-1 border border-border py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
