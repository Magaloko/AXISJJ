// components/members/TrainingLogDrawer.tsx
'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { logTraining } from '@/app/actions/training-log'
import { cn } from '@/lib/utils/cn'

const FOCUS_TAGS = ['Guard', 'Passing', 'Takedowns', 'No-Gi', 'Kondition', 'Sparring', 'Technik', 'Submissions']

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

interface Props {
  sessionId?: string | null
  onClose: () => void
  onSuccess?: () => void
}

function ScaleRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded border text-sm font-bold transition-colors',
              value === n
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function MoodRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex gap-3">
        {MOOD_EMOJIS.map((emoji, i) => {
          const v = i + 1
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-xl transition-all',
                value === v
                  ? 'border-primary bg-primary/10 scale-110'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type Step = 1 | 2 | 3

export function TrainingLogDrawer({ sessionId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    mood_before:  null as number | null,
    mood_after:   null as number | null,
    energy:       null as number | null,
    technique:    null as number | null,
    conditioning: null as number | null,
    mental:       null as number | null,
    focus_areas:  [] as string[],
    notes:        '',
    next_goal:    '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      focus_areas: f.focus_areas.includes(tag)
        ? f.focus_areas.filter(t => t !== tag)
        : [...f.focus_areas, tag],
    }))
  }

  function handleSubmit() {
    if (!form.mood_before) { setError('Bitte Stimmung vorher angeben.'); return }
    setError(null)
    startTransition(async () => {
      const result = await logTraining({
        session_id:   sessionId ?? null,
        mood_before:  form.mood_before!,
        mood_after:   form.mood_after ?? undefined,
        energy:       form.energy ?? undefined,
        technique:    form.technique ?? undefined,
        conditioning: form.conditioning ?? undefined,
        mental:       form.mental ?? undefined,
        focus_areas:  form.focus_areas,
        notes:        form.notes || undefined,
        next_goal:    form.next_goal || undefined,
      })
      if (result.error) { setError(result.error); return }
      onSuccess?.()
      onClose()
    })
  }

  const stepTitles: Record<Step, string> = {
    1: 'Stimmung & Energie',
    2: 'Fokus & Selbstbewertung',
    3: 'Notizen & Ziel',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-[90vh] w-full flex-col border-t border-border bg-card sm:h-full sm:max-w-sm sm:border-l sm:border-t-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Schritt {step}/3</p>
            <h2 className="text-base font-black text-foreground">{stepTitles[step]}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="h-1 bg-muted">
          <div className="h-1 bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <>
              <MoodRow label="Stimmung VORHER" value={form.mood_before} onChange={v => setForm(f => ({ ...f, mood_before: v }))} />
              <MoodRow label="Stimmung NACHHER" value={form.mood_after} onChange={v => setForm(f => ({ ...f, mood_after: v }))} />
              <ScaleRow label="⚡ Energie (1–5)" value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} />
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Fokus-Bereiche</p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded border px-3 py-1 text-xs font-bold transition-colors',
                        form.focus_areas.includes(tag)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <ScaleRow label="Technik (1–5)" value={form.technique} onChange={v => setForm(f => ({ ...f, technique: v }))} />
              <ScaleRow label="Kondition (1–5)" value={form.conditioning} onChange={v => setForm(f => ({ ...f, conditioning: v }))} />
              <ScaleRow label="Mental (1–5)" value={form.mental} onChange={v => setForm(f => ({ ...f, mental: v }))} />
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Notizen
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  placeholder="Was lief gut? Was möchtest du verbessern?"
                  className="w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Ziel für nächste Session
                </label>
                <input
                  type="text"
                  value={form.next_goal}
                  onChange={e => setForm(f => ({ ...f, next_goal: e.target.value }))}
                  placeholder="z.B. Rear naked choke aus back control"
                  className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        </div>

        <div className="border-t border-border p-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => (s - 1) as Step)}
              className="border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
            >
              Zurück
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !form.mood_before) { setError('Bitte Stimmung vorher angeben.'); return }
                setError(null)
                setStep(s => (s + 1) as Step)
              }}
              className="flex-1 bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'Speichern...' : 'Training speichern ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
