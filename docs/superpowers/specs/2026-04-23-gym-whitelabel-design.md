# Gym White-Label Platform — Design Spec

**Datum:** 2026-04-23  
**Status:** Approved  
**Pilot-Kunde:** Favorite Brazilian Jiu Jitsu, Wien

---

## Ziel

Das AXISJJ-Projekt soll als wiederverwendbare Plattform für beliebige Kampfsport-Gyms dienen. Jedes neue Gym erhält seine eigene Instanz (eigenes Repo-Fork, eigene Supabase-DB, eigenes Vercel-Deployment) mit gymspezifischem Branding und konfigurierbaren Features.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Multi-Tenancy-Ansatz | **White-Label Fork** (Ansatz A) — separates Deployment pro Gym |
| Konfiguration | `gym.config.ts` im Repo-Root mit Branding + Feature-Flags |
| Erster Scope | `public-only` — nur öffentliche Seiten + eingeschränktes Admin-Panel |
| Content-Verwaltung | Gym-Owner hat Admin-Zugang zu öffentlich-relevanten Bereichen |

---

## Architektur

```
AXISJJ (Haupt-Repo)
    │
    ├── Fork → favorite-jiujitsu   (Vercel: favorite-bjj.at)
    ├── Fork → kampfkunst-wien     (Vercel: kampfkunstwien.at)
    └── Fork → ...
```

Jeder Fork:
- Eigene `gym.config.ts` (Branding, Mode, Features)
- Eigenes Supabase-Projekt (vollständige Datenisolation)
- Eigenes Vercel-Deployment
- Updates via `git merge upstream/main`

---

## `gym.config.ts` Struktur

```ts
export interface GymConfig {
  // Betriebsmodus
  mode: 'public-only' | 'full'

  // Identität
  name: string
  sport: 'bjj' | 'mma' | 'wrestling' | 'kickboxing' | 'grappling'
  tagline: string
  logo: string              // Pfad relativ zu /public/
  affiliation?: string      // z.B. "Gremlin Jiu Jitsu"

  // Branding
  colors: {
    primary: string         // Hex
    secondary: string       // Hex
  }
  defaultLanguage: 'de' | 'en'

  // Kontakt
  address: string
  emailFrom: string

  // Social
  social: {
    instagram: string | null
    facebook: string | null
    whatsapp: string | null
  }

  // Öffentliche Feature-Flags
  features: {
    blog: boolean
    pricing: boolean
    tournaments: boolean
    publicCoaches: boolean
    heroSlides: boolean
  }
}
```

---

## Pilot-Config: Favorite Brazilian Jiu Jitsu

```ts
const config: GymConfig = {
  mode: 'public-only',
  name: 'Favorite Brazilian Jiu Jitsu',
  sport: 'bjj',
  tagline: 'BJJ · Grappling · Wrestling · Kindertraining in Wien.',
  logo: '/logo.jpg',
  affiliation: 'Gremlin Jiu Jitsu',
  colors: {
    primary: '#E8000F',     // Rot aus Logo
    secondary: '#000000',   // Schwarz
  },
  defaultLanguage: 'de',
  address: 'Johannagasse 29-35/15/R02, 1040 Wien',
  emailFrom: 'info@favorite-jiujitsu.at',
  social: {
    instagram: 'https://www.instagram.com/favorite.jiujitsu.academy/',
    facebook: null,
    whatsapp: null,
  },
  features: {
    blog: false,
    pricing: true,
    tournaments: true,
    publicCoaches: true,
    heroSlides: true,
  },
}
```

**Assets (bereitgestellt):**
| Datei | Verwendung |
|---|---|
| `logo.jpg` → `/public/logo.jpg` | Header, Favicon-Basis |
| `fotovo1.jpg` → `/public/hero-1.jpg` | Hero-Slide: Teambild Momentum Turnier |
| `fotovo2.jpg` → `/public/hero-2.jpg` | Hero-Slide: Einzelkämpfer mit Medaille |
| `stundenplan.jpg` | Referenz für DB-Seed der Klassen |

**Stundenplan (aus Bild):**
| Zeit | Mo | Di | Mi | Do | Fr |
|---|---|---|---|---|---|
| 16:30–17:30 | Kids JJJ | — | Kids JJJ | — | Kids JJJ |
| 18:00–19:15 | No-Gi Beginner | No-Gi Beginner | GI All Level | Wrestle Jitsu | Sparring |
| 19:30–20:45 | Advanced | Advanced | — | Advanced | Advanced |

---

## Route-Schutz (`middleware.ts`)

Im `public-only` Mode:
- `/dashboard/*` → Redirect zu `/`
- `/admin/*` → nur Whitelist erlaubt, Rest → `/admin/gym-settings`

**Admin-Whitelist im `public-only` Mode:**
```
/admin/gym-settings
/admin/opening-hours
/admin/pricing
/admin/coaches
/admin/hero-slides
/admin/sessions      (Stundenplan pflegen)
/admin/modules
```

---

## Admin-Navigation (eingeschränkt)

Jedes Nav-Item bekommt `publicOnly: boolean`. Im `public-only` Mode werden nur Items mit `publicOnly: true` gerendert. Member-spezifische Items (Mitglieder, Check-In, Subscriptions, etc.) sind ausgeblendet.

---

## Branding-Integration

Die Farben aus `gym.config.ts` werden als CSS Custom Properties ins Root-Layout injiziert:

```tsx
// app/layout.tsx
<body style={{
  '--color-primary': gymConfig.colors.primary,
  '--color-secondary': gymConfig.colors.secondary,
} as React.CSSProperties}>
```

Tailwind-Klassen wie `text-primary` und `bg-primary` referenzieren diese Variablen.

---

## Onboarding-Prozess (neues Gym, ~15 Min)

```
1. GitHub Repo forken
   └─ Magaloko/AXISJJ → Fork → "<gym-name>"

2. gym.config.ts anpassen
   └─ Name, Logo, Farben, Features, Adresse, Mode

3. Assets einfügen
   └─ /public/logo.jpg, /public/hero-1.jpg, /public/hero-2.jpg

4. Neues Supabase-Projekt erstellen
   └─ supabase db push (alle Migrations laufen)
   └─ Basis-Seed: gym_settings, belt_ranks, dashboard_modules

5. Env-Vars setzen
   └─ NEXT_PUBLIC_SUPABASE_URL
   └─ NEXT_PUBLIC_SUPABASE_ANON_KEY
   └─ SUPABASE_SERVICE_ROLE_KEY

6. Vercel-Deployment
   └─ Import Fork → Env-Vars → Deploy

7. Owner-Account anlegen
   └─ Supabase Auth → User → role='owner'
   └─ Owner füllt Inhalte via Admin-Panel

8. Content eintragen (Owner macht selbst)
   └─ Stundenplan, Preise, Coaches, Hero-Slides
```

---

## Upgrade-Pfad: `public-only` → `full`

Wenn das Gym die volle Plattform will (Member-Login, Buchungen, Check-In, etc.):

```ts
// gym.config.ts
mode: 'full'  // eine Zeile ändern
```

Alle Member-Routen und Admin-Bereiche sind sofort verfügbar. Keine Datenmigration nötig — Supabase-Schema ist bereits komplett vorhanden.

---

## Was NICHT in diesem Scope ist

- Zentrales Multi-Gym-Dashboard (gehört zu Ansatz B/SaaS)
- Automatisiertes Setup-Script (kann später als Erweiterung gebaut werden)
- Getrennte Codebase für public-only (bewusst vermieden — ein Repo, ein Schema)
- Kundenspezifische Sprachen/Übersetzungen über `de`/`en` hinaus
