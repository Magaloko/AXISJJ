'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteTheme, resetSiteTheme } from '@/app/actions/site-theme'
import {
  DEFAULT_THEME, DARK_THEME, LIGHT_THEME, RADIUS_PRESETS, type SiteTheme,
} from '@/lib/site-theme'
import { Palette, RotateCcw, Check, Eye, Moon, Sun, Type, Layout } from 'lucide-react'

interface ThemeEditorProps {
  initial: SiteTheme
}

const COLOR_GROUPS: { label: string; fields: { key: keyof SiteTheme; label: string; description: string }[] }[] = [
  {
    label: 'Brand',
    fields: [
      { key: 'primary',           label: 'Primary',       description: 'Hauptfarbe (Buttons, Akzente, Brand)' },
      { key: 'primaryForeground', label: 'Primary Text',  description: 'Textfarbe auf Primary (oft weiß)' },
      { key: 'accent',            label: 'Accent',        description: 'Akzentfarbe (Hover, Highlights)' },
      { key: 'accentForeground',  label: 'Accent Text',   description: 'Textfarbe auf Accent' },
    ],
  },
  {
    label: 'Surfaces',
    fields: [
      { key: 'background',           label: 'Background',      description: 'Seiten-Hintergrund' },
      { key: 'card',                 label: 'Card',             description: 'Karten-Hintergrund' },
      { key: 'secondary',            label: 'Secondary',        description: 'Zweitfarbe (Dark-Elemente, Chips)' },
      { key: 'border',               label: 'Border',           description: 'Rahmen und Trennlinien' },
    ],
  },
  {
    label: 'Text',
    fields: [
      { key: 'foreground',           label: 'Foreground',       description: 'Haupttextfarbe' },
      { key: 'secondaryForeground',  label: 'Secondary Text',   description: 'Textfarbe auf Secondary' },
    ],
  },
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

  const previewHeadingFont = theme.headingFont === 'serif'
    ? 'var(--font-instrument-serif), Georgia, serif'
    : 'var(--font-inter-tight), system-ui, sans-serif'

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* ── Editor ── */}
      <div className="space-y-6">

        {/* Preset bar */}
        <div className="border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Palette size={14} />
            <span className="text-xs font-bold uppercase tracking-widest">Schnell-Presets</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setTheme(DARK_THEME); setSaved(false) }}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary">
              <Moon size={12} /> Dark
            </button>
            <button onClick={() => { setTheme(LIGHT_THEME); setSaved(false) }}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary">
              <Sun size={12} /> Light
            </button>
            <button onClick={applyFromLogo}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary">
              <Palette size={12} /> Logo-Farben
            </button>
            <button onClick={reset}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary">
              <RotateCcw size={12} /> Lokal zurücksetzen
            </button>
            <button onClick={resetToDefaults} disabled={isPending}
              className="inline-flex items-center gap-1.5 border border-destructive bg-background px-3 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40">
              <RotateCcw size={12} /> Dark-Default (live)
            </button>
          </div>
        </div>

        {/* Color groups */}
        <div className="border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <Palette size={14} />
            <h2 className="text-xs font-bold uppercase tracking-widest">Farben</h2>
          </div>

          {error && <p className="mb-4 border border-destructive bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
          {saved && (
            <p className="mb-4 flex items-center gap-1.5 border border-[#2e7d32]/40 bg-[#2e7d32]/10 p-2 text-xs text-[#2e7d32]">
              <Check size={14} /> Gespeichert — Änderungen sind live.
            </p>
          )}

          <div className="space-y-6">
            {COLOR_GROUPS.map(group => (
              <div key={group.label}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.label}</p>
                <div className="space-y-1">
                  {group.fields.map(({ key, label, description }) => (
                    <div key={key} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 border-b border-border pb-2">
                      <label className="text-xs font-bold">{label}</label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme[key] as string}
                          onChange={e => update(key, e.target.value)}
                          className="h-8 w-10 cursor-pointer border border-border bg-background p-0.5"
                        />
                        <input
                          type="text"
                          value={theme[key] as string}
                          onChange={e => update(key, e.target.value)}
                          className="w-20 border border-border bg-background px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout & Typography */}
        <div className="border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layout size={14} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Layout & Typografie</h2>
            </div>
          </div>

          {/* Border radius */}
          <div className="mb-6">
            <p className="mb-1 text-xs font-bold">Border Radius</p>
            <p className="mb-3 text-xs text-muted-foreground">Abrundung von Buttons, Karten und Eingabefeldern.</p>
            <div className="flex flex-wrap gap-2">
              {RADIUS_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { update('radius', value); }}
                  className={`border px-3 py-1.5 text-xs font-bold transition-colors ${
                    theme.radius === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:border-primary'
                  }`}
                  style={{ borderRadius: value }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Heading font */}
          <div>
            <p className="mb-1 text-xs font-bold">Überschriften-Schriftart</p>
            <p className="mb-3 text-xs text-muted-foreground">Font für alle h1–h6 Überschriften auf der Website.</p>
            <div className="flex gap-2">
              <button
                onClick={() => update('headingFont', 'sans')}
                className={`flex items-center gap-2 border px-4 py-2 text-xs font-bold transition-colors ${
                  theme.headingFont === 'sans'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary'
                }`}
              >
                <Type size={12} />
                <span style={{ fontFamily: 'var(--font-inter-tight), system-ui, sans-serif' }}>Sans (Inter Tight)</span>
              </button>
              <button
                onClick={() => update('headingFont', 'serif')}
                className={`flex items-center gap-2 border px-4 py-2 text-xs font-bold transition-colors ${
                  theme.headingFont === 'serif'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary'
                }`}
              >
                <Type size={12} />
                <span style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontStyle: 'italic' }}>Serif (Instrument)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? 'Speichere...' : 'Speichern & live schalten'}
          </button>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div className="border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Eye size={14} />
          <h2 className="text-xs font-bold uppercase tracking-widest">Vorschau</h2>
        </div>

        <div
          className="overflow-hidden border text-[13px]"
          style={{ backgroundColor: theme.background, color: theme.foreground, borderColor: theme.border, borderRadius: theme.radius }}
        >
          {/* Mini Navbar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ backgroundColor: theme.secondary, borderBottom: `1px solid ${theme.border}` }}
          >
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primary }}>AXISJJ</span>
            <div className="flex gap-3">
              {['Training', 'Über uns', 'Kontakt'].map(item => (
                <span key={item} className="text-[10px] font-bold" style={{ color: theme.secondaryForeground, opacity: 0.7 }}>{item}</span>
              ))}
            </div>
            <button
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: theme.primary, color: theme.primaryForeground, borderRadius: theme.radius }}
            >
              Anmelden
            </button>
          </div>

          {/* Hero area */}
          <div className="px-4 py-5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>Brazilian Jiu-Jitsu Wien</p>
            <h3
              className="mt-1 text-xl font-black leading-tight"
              style={{ color: theme.foreground, fontFamily: previewHeadingFont }}
            >
              Trainiere mit den Besten.
            </h3>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: theme.foreground, opacity: 0.65 }}>
              Entdecke BJJ in einer professionellen Umgebung — für alle Levels.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"
                style={{ backgroundColor: theme.primary, color: theme.primaryForeground, borderRadius: theme.radius }}
              >
                Jetzt starten
              </button>
              <button
                className="border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"
                style={{ backgroundColor: 'transparent', color: theme.foreground, borderColor: theme.border, borderRadius: theme.radius }}
              >
                Mehr erfahren
              </button>
            </div>
          </div>

          {/* Card */}
          <div className="px-4 pb-4">
            <div
              className="border p-3"
              style={{ backgroundColor: theme.card, borderColor: theme.border, borderRadius: theme.radius }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold" style={{ color: theme.foreground }}>Nächstes Training</p>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: theme.accent, color: theme.accentForeground, borderRadius: theme.radius }}
                >
                  Heute
                </span>
              </div>
              <p className="mt-1 text-[10px]" style={{ color: theme.foreground, opacity: 0.6 }}>
                BJJ Gi · 18:30 – 20:00 Uhr
              </p>

              {/* Input example */}
              <input
                readOnly
                value="dein@email.at"
                className="mt-3 w-full border px-2 py-1 text-[10px]"
                style={{
                  backgroundColor: theme.background,
                  color: theme.foreground,
                  borderColor: theme.border,
                  borderRadius: theme.radius,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Accent bar */}
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{ backgroundColor: theme.accent, borderTop: `1px solid ${theme.border}` }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accentForeground }} />
            <p className="text-[10px] font-bold" style={{ color: theme.accentForeground }}>Accent Color</p>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          Speichern wendet alle Änderungen live auf die Website an.
        </p>
      </div>
    </div>
  )
}
