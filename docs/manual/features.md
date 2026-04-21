# Feature-Übersicht — AXIS JJ

Alle Features der Plattform auf einen Blick.

## Öffentliche Landing Page
- Hero-Slider (verwaltbar im Admin)
- Stats-Bar (Mitglieder-Count, Gym-Jahre)
- **Coach-Slider** — dynamisch aus DB, Shamsudin immer gepinnt
- **Tournament-Section** — kommende genehmigte Turniere + Teilnehmer-Slider
- Programs-Grid (Klassentypen mit Bild)
- Pricing-Tabelle
- Wochen-Schedule
- Blog-Posts
- Favicon + OG-Image für alle Plattformen (iOS, Android, Chrome)

## Mitglieder-Bereich (`/dashboard`)
- Persönliches Dashboard (nächste Klasse, XP, Belt)
- Klassen buchen (`/buchen`)
- Training-Tagebuch (`/mein-training`)
- Stimmungs-Chart, Skill-Radar, Trainings-Häufigkeit
- **Turniere** (`/dashboard/turniere`) — anmelden mit Gewichtsklasse + Gi/No-Gi
- BJJ-Regeln-Quiz (`/bjj-rules`)
- Leaderboard (`/leaderboard`)
- Gürtel-Fortschritt (`/gurtel`)
- Skills-Übersicht (`/skills`)
- Konto-Einstellungen (`/konto`)
- QR-Code für Check-In

## Gamification
- XP-System (Trainings, Quiz, Rules, Skills)
- Badges mit Bedingungen
- Leaderboard (Top-Mitglieder)
- BJJ-Regel-Spiel (Karten-basiert)

## Admin — OPS (Coach + Owner)
- Dashboard mit Gym-KPIs (Klassen heute, Buchungen, Mitglieder, Check-Ins)
- Check-In (QR + manuell)
- Training/Klassen (Kalender, Sessions erstellen, Coach-Notizen)
- **Turniere** (erstellen, bearbeiten, Anmeldungen prüfen)

## Admin — Owner only
### Mitglieder
- Mitglieder-Liste + Details-Panel
- **Website-Profil** für Coaches (Bio, Erfolge, Sichtbarkeit)
- Abo-Management
- Trainings-Historie, Stimmungs-Trend
- Skill-Management
- Wettkampf-Historie
- Coach-Notizen (privat)

### Gürtel
- Eligibility-Check (wer ist bereit?)
- Belt-Promotion
- Promotion-Historie

### Leads (CRM)
- Kanban-Board (Neu/Kontaktiert/Konvertiert/Verloren)
- Drag-and-Drop

### Business
- **Berichte**:
  - Umsatz + vs. Vormonat
  - Lead-Konversionsrate
  - Ø Klassen-Fill-Rate (30T)
  - Top-Klassen nach Attendance
  - Inaktive Mitglieder
  - 8-Wochen-Utilization-Trend

### Content
- Blog (Markdown-Posts)
- Curriculum (Lehrplan nach Monat/Woche)
- Hero-Slider
- Klassentyp-Bilder

### System
- Gym-Einstellungen (Kontakt, Öffnungszeiten, Richtlinien)
- Preisgestaltung (Student/Adult/Kids)
- Rollenverwaltung (Mitglied ↔ Coach)
- Klassentypen (mit Bildern: Upload + URL)
- **Audit-Log** (alle admin-Aktionen)

## Technik-Stack
- **Frontend**: Next.js 15 App Router, React, TypeScript, Tailwind CSS
- **Animationen**: Framer Motion
- **Icons**: Lucide
- **Backend/DB**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (Magic Link / Password)
- **Storage**: Supabase Storage (Coach-Fotos, Klassentyp-Bilder)
- **Hosting**: Vercel (auto-deploy von main)
- **Tests**: Vitest + React Testing Library
- **Notifications**: Telegram-Webhook (Admin-Events)

## Sicherheit
- Row-Level Security (RLS) auf allen Tabellen
- Rolle-basierte Zugriffskontrolle (member / coach / owner)
- Public Views für öffentliche Daten (public_coaches, coach_profiles public-read)
- Audit-Log für alle Owner-Aktionen
