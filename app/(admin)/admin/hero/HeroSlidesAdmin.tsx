'use client'

import { useState, useTransition, useOptimistic } from 'react'
import Image from 'next/image'
import {
  toggleHeroSlideActive,
  deleteHeroSlide,
  createHeroSlide,
  updateHeroSlide,
} from '@/app/actions/hero-slides'
import type { HeroSlide } from '@/app/actions/hero-slides'
import { Eye, EyeOff, Trash2, Plus, Pencil, X, Check } from 'lucide-react'

// ---------- Slide Card ----------
function SlideCard({
  slide,
  onToggle,
  onDelete,
  onEdit,
}: {
  slide: HeroSlide
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onEdit: (slide: HeroSlide) => void
}) {
  const isText = slide.type === 'text'
  return (
    <div
      className={`rounded-lg border bg-card p-4 transition-opacity ${
        slide.is_active ? 'opacity-100' : 'opacity-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Preview thumbnail */}
        <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded bg-muted">
          {slide.image_url ? (
            <Image
              src={slide.image_url}
              alt={slide.image_alt ?? ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {(slide.headline ?? []).join(' ')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isText
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              {isText ? 'Text' : 'Promo'}
            </span>
            <span className="text-xs text-muted-foreground">Position {slide.position}</span>
          </div>
          {isText ? (
            <>
              <p className="truncate text-sm font-semibold">{(slide.headline ?? []).join(' · ')}</p>
              <p className="truncate text-xs text-muted-foreground">{slide.eyebrow}</p>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-semibold">{slide.promo_headline}</p>
              <p className="truncate text-xs text-muted-foreground">{slide.tag_label}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-1">
          <button
            onClick={() => onToggle(slide.id, !slide.is_active)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={slide.is_active ? 'Deaktivieren' : 'Aktivieren'}
          >
            {slide.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={() => onEdit(slide)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Bearbeiten"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(slide.id)}
            className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
            title="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Slide Form ----------
const EMPTY_TEXT: Omit<HeroSlide, 'id'> = {
  position: 99,
  is_active: true,
  type: 'text',
  eyebrow: 'Brazilian Jiu-Jitsu Vienna · Since 2020',
  headline: ['DISCIPLINE.', 'TECHNIQUE.', 'PROGRESS.'],
  subtext: '',
  subtext2: '',
  address: 'Strindberggasse 1 / R01 · 1110 Wien',
  cta_primary_label: '1 WOCHE GRATIS →',
  cta_primary_href: '/trial',
  cta_secondary_label: 'STUNDENPLAN',
  cta_secondary_href: '#trainingsplan',
}

const EMPTY_PROMO: Omit<HeroSlide, 'id'> = {
  position: 99,
  is_active: true,
  type: 'promo',
  image_url: '',
  image_alt: '',
  badge_label: '',
  badge_color: '#ef4444',
  tag_label: '',
  offers: [],
  promo_headline: '',
  cta_label: '👉 Jetzt anmelden!',
  cta_href: '/trial',
}

function SlideForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Omit<HeroSlide, 'id'> & { id?: string }
  onSave: (data: Omit<HeroSlide, 'id'> & { id?: string }) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [form, setForm] = useState(initial)

  function set(key: keyof HeroSlide, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const headlineStr = (form.headline ?? []).join('\n')

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{form.id ? 'Slide bearbeiten' : 'Neuer Slide'}</h3>
        <button onClick={onCancel} className="rounded p-1 hover:bg-muted">
          <X size={18} />
        </button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(['text', 'promo'] as const).map(t => (
          <button
            key={t}
            onClick={() => setForm(t === 'text' ? { ...EMPTY_TEXT, id: form.id } : { ...EMPTY_PROMO, id: form.id })}
            className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
              form.type === t
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-muted'
            }`}
          >
            {t === 'text' ? 'Text Slide' : 'Promo Slide'}
          </button>
        ))}
      </div>

      {/* Common */}
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</span>
          <input
            type="number"
            value={form.position}
            onChange={e => set('position', Number(e.target.value))}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm font-medium">Aktiv (auf Landing Page sichtbar)</span>
        </label>
      </div>

      {/* Text slide fields */}
      {form.type === 'text' && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eyebrow (Oberzeile)</span>
            <input
              value={form.eyebrow ?? ''}
              onChange={e => set('eyebrow', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Brazilian Jiu-Jitsu Vienna · Since 2020"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Headline (eine Zeile pro Zeile)</span>
            <textarea
              rows={3}
              value={headlineStr}
              onChange={e => set('headline', e.target.value.split('\n'))}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder={"DISCIPLINE.\nTECHNIQUE.\nPROGRESS."}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtext (Zeile 1)</span>
            <input
              value={form.subtext ?? ''}
              onChange={e => set('subtext', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtext (Zeile 2)</span>
            <input
              value={form.subtext2 ?? ''}
              onChange={e => set('subtext2', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse</span>
            <input
              value={form.address ?? ''}
              onChange={e => set('address', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Primär Text</span>
              <input
                value={form.cta_primary_label ?? ''}
                onChange={e => set('cta_primary_label', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Primär Link</span>
              <input
                value={form.cta_primary_href ?? ''}
                onChange={e => set('cta_primary_href', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Sekundär Text</span>
              <input
                value={form.cta_secondary_label ?? ''}
                onChange={e => set('cta_secondary_label', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Sekundär Link</span>
              <input
                value={form.cta_secondary_href ?? ''}
                onChange={e => set('cta_secondary_href', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      )}

      {/* Promo slide fields */}
      {form.type === 'promo' && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bild URL (z.B. /images/promo-mai.jpg)</span>
            <input
              value={form.image_url ?? ''}
              onChange={e => set('image_url', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="/images/promo-mai.jpg"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bild Alt-Text</span>
            <input
              value={form.image_alt ?? ''}
              onChange={e => set('image_alt', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Badge (roter Text oben)</span>
            <input
              value={form.badge_label ?? ''}
              onChange={e => set('badge_label', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Brazilian Jiu-Jitsu by AXIS"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tag (farbiger Hinweis)</span>
            <input
              value={form.tag_label ?? ''}
              onChange={e => set('tag_label', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Starte jetzt – nur bis Ende April"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Headline</span>
            <input
              value={form.promo_headline ?? ''}
              onChange={e => set('promo_headline', e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Jetzt starten – sichere dir deinen Platz!"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Text</span>
              <input
                value={form.cta_label ?? ''}
                onChange={e => set('cta_label', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">CTA Link</span>
              <input
                value={form.cta_href ?? ''}
                onChange={e => set('cta_href', e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
          {/* Offers */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Angebots-Badges</span>
            {(form.offers ?? []).map((offer, i) => (
              <div key={i} className="mb-2 flex gap-2 items-center">
                <input
                  value={offer.label}
                  onChange={e => {
                    const next = [...(form.offers ?? [])]
                    next[i] = { ...next[i], label: e.target.value }
                    set('offers', next)
                  }}
                  className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm"
                  placeholder="Badge Text"
                />
                <button
                  onClick={() => {
                    const next = [...(form.offers ?? [])]
                    next.splice(i, 1)
                    set('offers', next)
                  }}
                  className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                set('offers', [
                  ...(form.offers ?? []),
                  { label: '', bg: 'bg-primary', text: 'text-white' },
                ])
              }
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus size={14} /> Badge hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Check size={16} />
          {isSaving ? 'Speichern…' : 'Speichern'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

// ---------- Main Component ----------
export function HeroSlidesAdmin({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const [slides, setSlides] = useState(initialSlides)
  const [editingSlide, setEditingSlide] = useState<(Omit<HeroSlide, 'id'> & { id?: string }) | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newType, setNewType] = useState<'text' | 'promo'>('text')
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, active: boolean) {
    setSlides(s => s.map(sl => (sl.id === id ? { ...sl, is_active: active } : sl)))
    startTransition(async () => {
      await toggleHeroSlideActive(id, active)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Slide wirklich löschen?')) return
    setSlides(s => s.filter(sl => sl.id !== id))
    startTransition(async () => {
      await deleteHeroSlide(id)
    })
  }

  function handleSaveNew(data: Omit<HeroSlide, 'id'>) {
    startTransition(async () => {
      await createHeroSlide(data)
      setShowNewForm(false)
      // Refresh from server not needed – revalidatePath handles it
      // But we add optimistically
      setSlides(s => [...s, { ...data, id: Math.random().toString() }])
    })
  }

  function handleSaveEdit(data: Omit<HeroSlide, 'id'> & { id?: string }) {
    if (!data.id) return
    const { id, ...rest } = data
    setSlides(s => s.map(sl => (sl.id === id ? { ...sl, ...rest } : sl)))
    startTransition(async () => {
      await updateHeroSlide(id, rest)
      setEditingSlide(null)
    })
  }

  return (
    <div className="space-y-3">
      {/* Slide list */}
      {slides.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Slides vorhanden. Erstelle deinen ersten Slide.
        </p>
      )}
      {slides
        .slice()
        .sort((a, b) => a.position - b.position)
        .map(slide =>
          editingSlide?.id === slide.id ? (
            <SlideForm
              key={slide.id}
              initial={editingSlide}
              onSave={handleSaveEdit}
              onCancel={() => setEditingSlide(null)}
              isSaving={isPending}
            />
          ) : (
            <SlideCard
              key={slide.id}
              slide={slide}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={sl => setEditingSlide(sl)}
            />
          )
        )}

      {/* New slide form */}
      {showNewForm ? (
        <SlideForm
          initial={newType === 'text' ? EMPTY_TEXT : EMPTY_PROMO}
          onSave={handleSaveNew}
          onCancel={() => setShowNewForm(false)}
          isSaving={isPending}
        />
      ) : (
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => { setNewType('text'); setShowNewForm(true) }}
            className="flex items-center gap-2 rounded border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={16} /> Text Slide
          </button>
          <button
            onClick={() => { setNewType('promo'); setShowNewForm(true) }}
            className="flex items-center gap-2 rounded border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={16} /> Promo Slide
          </button>
        </div>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground animate-pulse">Änderungen werden gespeichert…</p>
      )}
    </div>
  )
}
