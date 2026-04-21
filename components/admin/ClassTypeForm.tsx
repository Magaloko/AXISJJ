'use client'

import { useState, useTransition, useRef } from 'react'
import { upsertClassType } from '@/app/actions/class-types'
import { uploadClassTypeImage } from '@/app/actions/class-type-image'
import { useRouter } from 'next/navigation'
import { translations, type Lang } from '@/lib/i18n'

export interface ClassTypeRow {
  id?: string
  name: string
  description: string | null
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
  image_url?: string | null
}

interface Props { initial?: ClassTypeRow; onClose: () => void; lang: Lang }

export function ClassTypeForm({ initial, onClose, lang }: Props) {
  const te = translations[lang].admin.einstellungen
  const tex = translations[lang].admin.einstellungenExtra
  const [form, setForm] = useState<ClassTypeRow>(initial ?? { name: '', description: '', level: 'all', gi: true })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)
    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadClassTypeImage(fd)
    setIsUploading(false)
    if (result.error) { setImageError(result.error); return }
    setImageUrl(result.url ?? '')
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await upsertClassType({
        id: initial?.id,
        name: form.name,
        description: form.description ?? undefined,
        level: form.level,
        gi: form.gi,
        image_url: imageUrl || null,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{initial ? te.editType : te.newType}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <input className="w-full border border-border bg-background p-2 text-sm" placeholder={tex.name}
               value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full border border-border bg-background p-2 text-sm" placeholder={tex.description} rows={3}
                  value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        <select className="w-full border border-border bg-background p-2 text-sm"
                value={form.level} onChange={e => setForm({ ...form, level: e.target.value as ClassTypeRow['level'] })}>
          <option value="beginner">{te.levelBeginner}</option>
          <option value="all">{te.levelAll}</option>
          <option value="advanced">{te.levelAdvanced}</option>
          <option value="kids">{te.levelKids}</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.gi} onChange={e => setForm({ ...form, gi: e.target.checked })} />
          {tex.withGi}
        </label>
        {/* Image */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{tex.image}</label>
          {imageUrl && (
            <div className="mb-2 relative w-full h-32 overflow-hidden rounded border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-1 right-1 bg-background/80 px-1 text-xs text-destructive border border-border"
              >
                ✕
              </button>
            </div>
          )}
          {imageError && <p className="mb-1 text-xs text-destructive">{imageError}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-border bg-background p-2 text-sm"
              placeholder={tex.imageUrlPlaceholder}
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImageError(null) }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border border-border px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              {isUploading ? '…' : tex.upload}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={isPending}
                  className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {tex.save}
          </button>
          <button onClick={onClose} className="border border-border px-4 py-2 text-sm">{tex.cancel}</button>
        </div>
      </div>
    </div>
  )
}
