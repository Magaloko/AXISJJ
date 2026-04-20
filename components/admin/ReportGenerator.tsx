'use client'

import { useMemo, useRef, useState } from 'react'
import { generateReport, type GeneratedReport } from '@/app/actions/generate-report'

type Photo = {
  id: string
  name: string
  dataUrl: string
  caption: string
}

export function ReportGenerator() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sessionLabel, setSessionLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedReport | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notesCount = notes.length
  const notesLimit = 4000
  const canSubmit = useMemo(() => notes.trim().length >= 10 && !loading, [notes, loading])

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const readers: Promise<Photo>[] = []
    const existing = photos.length
    const max = 20
    for (let i = 0; i < files.length && existing + readers.length < max; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      readers.push(
        new Promise<Photo>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(reader.error ?? new Error('FileReader-Fehler'))
          reader.onload = () =>
            resolve({
              id: crypto.randomUUID(),
              name: file.name,
              dataUrl: String(reader.result ?? ''),
              caption: '',
            })
          reader.readAsDataURL(file)
        }),
      )
    }
    try {
      const next = await Promise.all(readers)
      setPhotos((prev) => [...prev, ...next].slice(0, 20))
    } catch (e) {
      console.error(e)
    }
  }

  function updateCaption(id: string, caption: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)))
  }
  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    const res = await generateReport({
      notes: notes.trim(),
      hashtags: hashtags.trim(),
      sessionLabel: sessionLabel.trim(),
      photoCaptions: photos.map((p) => p.caption.trim()).filter(Boolean),
    })
    setLoading(false)
    if (res.error) setError(res.error)
    else if (res.data) setResult(res.data)
  }

  async function copy(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied((c) => (c === field ? null : c)), 1500)
    } catch {
      /* ignored */
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Session (optional)
          </label>
          <input
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            placeholder="z. B. Dienstag Fundamentals, Kinder 17 Uhr"
            className="w-full border border-border bg-input px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="mb-1 flex items-end justify-between">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Fotos (optional, max. 20)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-border px-3 py-1 text-xs font-bold uppercase tracking-widest hover:bg-muted"
            >
              Fotos wählen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          {photos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Keine Fotos ausgewählt. Die Fotos werden nicht hochgeladen oder gespeichert, nur
              ihre Captions gehen in die Generierung ein.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {photos.map((p) => (
                <div key={p.id} className="flex gap-3 border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={p.name} className="h-24 w-24 flex-shrink-0 object-cover" />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        entfernen
                      </button>
                    </div>
                    <input
                      value={p.caption}
                      onChange={(e) => updateCaption(p.id, e.target.value)}
                      placeholder="kurze Beschreibung (z. B. 'Max in Half-Guard')"
                      className="w-full border border-border bg-input px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-end justify-between">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Meine Notizen
            </label>
            <span className="text-[11px] text-muted-foreground">
              {notesCount} / {notesLimit}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            maxLength={notesLimit}
            placeholder={`Was wurde trainiert? Wer war dabei? Was lief gut?\nz. B. "Heute Knee-Cut aus Half-Guard, 8 Weißgurte, Max und Lisa besonders sauber, am Ende 10 Min Positionssparring"`}
            className="w-full resize-y border border-border bg-input px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Hashtags (optional)
          </label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#bjj #wien #fundamentals #openmat"
            className="w-full border border-border bg-input px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Generiere …' : 'Bericht generieren'}
          </button>
          {result && (
            <button
              type="button"
              onClick={() => {
                setResult(null)
              }}
              className="border border-border px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted"
            >
              Ergebnis verwerfen
            </button>
          )}
        </div>
      </form>

      {result && (
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Ergebnis</h2>

          <ResultBlock
            label="Titel"
            value={result.title}
            copied={copied === 'title'}
            onCopy={() => copy('title', result.title)}
          />
          <ResultBlock
            label="Kurztext"
            value={result.summary}
            copied={copied === 'summary'}
            onCopy={() => copy('summary', result.summary)}
          />
          <ResultBlock
            label="Bericht (Markdown)"
            value={result.body_md}
            copied={copied === 'body'}
            onCopy={() => copy('body', result.body_md)}
            big
          />
          <ResultBlock
            label="Instagram-Caption"
            value={result.instagram_caption}
            copied={copied === 'ig'}
            onCopy={() => copy('ig', result.instagram_caption)}
            big
          />
        </div>
      )}
    </div>
  )
}

function ResultBlock({
  label,
  value,
  copied,
  onCopy,
  big,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  big?: boolean
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="border border-border px-3 py-1 text-xs font-bold uppercase tracking-widest hover:bg-muted"
        >
          {copied ? 'Kopiert ✓' : 'Kopieren'}
        </button>
      </div>
      <pre
        className={`whitespace-pre-wrap break-words border border-border bg-muted/40 p-3 font-mono text-xs ${big ? 'max-h-[400px] overflow-auto' : ''}`}
      >
        {value}
      </pre>
    </div>
  )
}
