'use client'

import { useState, useTransition } from 'react'
import { deleteClassType } from '@/app/actions/class-types'
import { ClassTypeForm, type ClassTypeRow } from './ClassTypeForm'
import { useRouter } from 'next/navigation'
import { translations, type Lang } from '@/lib/i18n'

interface Props { types: ClassTypeRow[]; lang: Lang }

export function ClassTypeTable({ types, lang }: Props) {
  const te = translations[lang].admin.einstellungen
  const tex = translations[lang].admin.einstellungenExtra
  const [editing, setEditing] = useState<ClassTypeRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function remove(t: ClassTypeRow) {
    if (!t.id) return
    if (!confirm(te.deleteConfirm)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteClassType(t.id!)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function labelForLevel(level: string) {
    const labels: Record<string, string> = {
      beginner: te.levelBeginner,
      all: te.levelAll,
      advanced: te.levelAdvanced,
      kids: te.levelKids,
    }
    return labels[level] ?? level
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tex.classTypes}</p>
        <button onClick={() => setCreating(true)}
                className="bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
          {tex.newBtn}
        </button>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <ul className="divide-y divide-border">
        {types.map(t => (
          <li key={t.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {t.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image_url} alt={t.name} className="h-10 w-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{labelForLevel(t.level)} · {t.gi ? te.gi : te.noGi}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(t)} className="border border-border px-2 py-1 text-[10px]">Edit</button>
              <button onClick={() => remove(t)} disabled={isPending}
                      className="border border-destructive px-2 py-1 text-[10px] text-destructive">✕</button>
            </div>
          </li>
        ))}
      </ul>
      {creating && <ClassTypeForm onClose={() => setCreating(false)} lang={lang} />}
      {editing && <ClassTypeForm initial={editing} onClose={() => setEditing(null)} lang={lang} />}
    </div>
  )
}
