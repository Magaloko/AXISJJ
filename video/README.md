# AXIS · Jiu-Jitsu — Social Ad Video

Vertikaler 30-Sekunden-Werbespot (1080×1920, 30fps, ohne Audio) basierend auf `public/bedienungsanleitung.html`.

## Setup

```bash
cd video
npm install
```

## Preview (Remotion Studio)

```bash
npm run dev
```

Öffnet das Remotion Studio im Browser — Live-Preview + Scrubben.

## Render

```bash
npm run render         # MP4 → out/axis-ad-30.mp4
npm run render:gif     # GIF → out/axis-ad-30.gif
npm run still          # Poster-Frame → out/still.png
```

## Struktur

- `src/index.tsx` — Remotion Entry (registerRoot)
- `src/Root.tsx` — Composition-Definition
- `src/AxisAd.tsx` — Haupt-Komposition, Sequencing aller Szenen
- `src/sections/Hero.tsx` — Intro (0–3s)
- `src/sections/RoleSection.tsx` — Mitglied / Coach / Owner (je ~6s)
- `src/sections/CTA.tsx` — Call-to-Action-Outro (~8s)
- `src/components/Background.tsx` — Animierte Farb-Orbs
- `src/components/Card.tsx` — Feature-Karte mit Spring-Animation
- `src/components/Icons.tsx` — Lucide-Icons als React-Komponenten
- `src/theme.ts` — Farben & Fonts (matcht bedienungsanleitung.html)

## Timing (900 Frames @ 30fps = 30s)

| Sequenz  | Start | Dauer | Beschreibung                  |
|----------|-------|-------|-------------------------------|
| Hero     | 0     | 90f   | "Deine Plattform auf einen Blick" |
| Member   | 90    | 190f  | 4 Feature-Karten              |
| Coach    | 280   | 190f  | 4 Feature-Karten              |
| Owner    | 470   | 190f  | 4 Feature-Karten              |
| CTA      | 660   | 240f  | "Eine App. Alles drin."       |
