'use client'

import { useState, useTransition } from 'react'
import { sendBulkEmail } from '@/app/actions/bulk-email'

export function BulkEmailForm() {
  const [form, setForm] = useState({
    audience: 'members' as 'members' | 'coaches' | 'all',
    subject: '',
    body: '',
  })
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmSend, setConfirmSend] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmSend) { setConfirmSend(true); return }

    setResult(null)
    startTransition(async () => {
      const res = await sendBulkEmail(form)
      if (res.error) {
        setResult({ type: 'error', text: res.error })
      } else {
        setResult({
          type: 'success',
          text: `${res.sent} E-Mails versendet${res.failed ? ` · ${res.failed} fehlgeschlagen` : ''}.`,
        })
        setForm({ audience: 'members', subject: '', body: '' })
      }
      setConfirmSend(false)
    })
  }

  const inputCls = 'w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground'

  const audienceLabels = {
    members: 'Alle Mitglieder',
    coaches: 'Alle Coaches',
    all: 'Alle (Mitglieder + Coaches)',
  }

  return (
    <div className="border border-border bg-card p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Bulk-E-Mail</p>
      <p className="mb-5 text-sm text-muted-foreground">
        Nachricht an ausgewählte Gruppe senden (einmalig).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Empfänger</label>
          <select
            value={form.audience}
            onChange={e => { setForm({ ...form, audience: e.target.value as BulkEmailForm['audience'] }); setConfirmSend(false) }}
            className={inputCls}
          >
            <option value="members">Alle Mitglieder</option>
            <option value="coaches">Alle Coaches</option>
            <option value="all">Alle (Mitglieder + Coaches)</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Betreff</label>
          <input
            required
            value={form.subject}
            onChange={e => { setForm({ ...form, subject: e.target.value }); setConfirmSend(false) }}
            maxLength={200}
            placeholder="z.B. Sommer-Seminar Ankündigung"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Nachricht (Plain Text, 2 Leerzeilen = neuer Absatz)</label>
          <textarea
            required
            rows={8}
            value={form.body}
            onChange={e => { setForm({ ...form, body: e.target.value }); setConfirmSend(false) }}
            maxLength={10_000}
            placeholder="Hallo zusammen,&#10;&#10;am kommenden Samstag findet ein Seminar mit..."
            className={`${inputCls} resize-none font-mono`}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">{form.body.length}/10000 Zeichen</p>
        </div>

        {result && (
          <p className={`text-sm ${result.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
            {result.text}
          </p>
        )}

        <div>
          {confirmSend && !isPending && (
            <p className="mb-2 text-sm font-semibold text-destructive">
              Bestätigen: E-Mail an {audienceLabels[form.audience]} senden?
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                confirmSend
                  ? 'bg-destructive text-white hover:opacity-90'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {isPending ? 'Sende...' : confirmSend ? 'Ja, jetzt senden' : 'Senden →'}
            </button>
            {confirmSend && (
              <button
                type="button"
                onClick={() => setConfirmSend(false)}
                className="border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

type BulkEmailForm = { audience: 'members' | 'coaches' | 'all' }
