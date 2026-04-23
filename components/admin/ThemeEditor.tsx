'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteTheme, resetSiteTheme } from '@/app/actions/site-theme'
import { DEFAULT_THEME, DARK_THEME, LIGHT_THEME, type SiteTheme } from '@/lib/site-theme'
import { Palette, RotateCcw, Check, Eye, Moon, Sun } from 'lucide-react'

interface ThemeEditorProps {
  initial: SiteTheme
}

const FIELD_CONFIG: { key: keyof SiteTheme; label: string; description: string }[] = [
  { key: 'primary',              label: 'Primary',              description: 'Hauptfarbe (Buttons, Akzente, Brand-Elemente)' },
  { key: 'primaryForeground',    label: 'Primary Text',         description: 'Textfarbe auf Primary (oft weiß)' },
  { key: 'secondary',            label: 'Secondary',            description: 'Zweitfarbe (Hintergründe, Dark-Elemente)' },
  { key: 'secondaryForeground',  label: 'Secondary Text',       description: 'Textfarbe auf Secondary' },
  { key: 'accent',               label: 'Accent',               description: 'Akzentfarbe (Hover, Highlights)' },
  { key: 'accentForeground',     label: 'Accent Text',          description: 'Textfarbe auf Accent' },
  { key: 'background',           label: 'Background',           description: 'Seiten-Hintergrund' },
  { key: 'foreground',           label: 'Foreground',           description: 'Haupttextfarbe' },
  { key: 'card',                 label: 'Card',                 description: 'Karten-Hintergrund' },
  { key: 'border',               label: 'Border',               description: 'Rahmen und Trennlinien' },
]

export function ThemeEditor({ initial }: ThemeEditorProps) {
  const [theme, setTheme] = useState<SiteTheme>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function update<K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) {
    setTheme(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateSiteTheme(theme)
      if (res.error) { setError(res.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  function reset() {
    setTheme(DEFAULT_THEME)
    setSaved(false)
  }

  function applyFromLogo() {
    // Favorite BJJ / common gym branding preset
    setTheme({
      ...theme,
      primary:             '#e8000f',
      primaryForeground:   '#ffffff',
      secondary:           '#000000',
      secondaryForeground: '#ffffff',
      accent:              '#e8000f',
      accentForeground:    '#ffffff',
    })
    setSaved(false)
  }

  async function resetToDefaults() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await resetSiteTheme()
      if (res.error) { setError(res.error); return }
      setTheme(DEFAULT_THEME)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Editor */}
      <div className="border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette size={16} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Farben</h2>
        </div>

        {error && <p className="mb-3 border border-destructive bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
        {saved && (
          <p className="mb-3 flex items-center gap-1.5 border border-[#2e7d32]/40 bg-[#2e7d32]/10 p-2 text-xs text-[#2e7d32]">
            <Check size={14} /> Gespeichert — Änderungen sind live.
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setTheme(DARK_THEME); setSaved(false) }}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary"
          >
            <Moon size={12} /> Dark Preset
          </button>
          <button
            onClick={() => { setTheme(LIGHT_THEME); setSaved(false) }}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary"
          >
            <Sun size={12} /> Light Preset
          </button>
          <button
            onClick={applyFromLogo}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary"
          >
            <Palette size={12} /> Logo-Farben (Rot/Schwarz)
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary"
          >
            <RotateCcw size={12} /> Zurücksetzen
          </button>
          <button
            onClick={resetToDefaults}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 border border-destructive bg-background px-3 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
          >
            <RotateCcw size={12} /> Auf Dark-Default (live)
          </button>
        </div>

        <div className="grid gap-3">
          {FIELD_CONFIG.map(({ key, label, description }) => (
            <div key={key} className="grid grid-cols-[100px_1fr_120px] items-center gap-3 border-b border-border pb-2">
              <label className="text-xs font-bold">{label}</label>
              <div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[key]}
                  onChange={e => update(key, e.target.value)}
                  className="h-8 w-12 cursor-pointer border border-border bg-background"
                />
                <input
                  type="text"
                  value={theme[key]}
                  onChange={e => update(key, e.target.value)}
                  className="w-20 border border-border bg-background px-2 py-1 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Eye size={16} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Vorschau</h2>
        </div>

        <div
          className="rounded border p-4"
          style={{
            backgroundColor: theme.background,
            color: theme.foreground,
            borderColor: theme.border,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
            Eyebrow
          </p>
          <h3 className="mt-1 text-xl font-black" style={{ color: theme.foreground }}>
            Heading Text
          </h3>
          <p className="mt-2 text-sm" style={{ color: theme.foreground, opacity: 0.7 }}>
            Body text with lorem ipsum dolor sit amet consectetur.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 text-xs font-black uppercase tracking-widest"
              style={{ backgroundColor: theme.primary, color: theme.primaryForeground }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 text-xs font-black uppercase tracking-widest"
              style={{ backgroundColor: theme.secondary, color: theme.secondaryForeground }}
            >
              Secondary
            </button>
          </div>

          <div
            className="mt-4 rounded border p-3"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <p className="text-xs font-bold" style={{ color: theme.foreground }}>Card Element</p>
            <p className="mt-1 text-xs" style={{ color: theme.foreground, opacity: 0.6 }}>
              Mit Border und Card-Hintergrund.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <p className="text-xs" style={{ color: theme.accent }}>Accent Color</p>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          Vorschau zeigt die aktuelle Auswahl. Speichern wendet auf die ganze Website an.
        </p>
      </div>
    </div>
  )
}
