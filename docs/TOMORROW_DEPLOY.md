# Großer Deploy — Vorbereitung

Nach dem Resetten des Vercel-Limits (Mittwoch) geht alles auf Production live.

## ✅ Neue Features (commited, wartet auf Deploy)

### Mitglieder
- **Wettkampf-Tracking** (`/dashboard`) — Member können Turnier-Teilnahmen + Ergebnisse eintragen
  - Name, Datum, Ort, Kategorie, Platzierung, Notizen
  - Sortiert nach Datum absteigend
- **Trial-Auto-Bestätigung** — nach `/trial` Formular bekommt Interessent sofort schöne HTML-Bestätigungsmail

### Admin / Coach / Owner
- **Inaktive-Mitglieder-Widget** (Owner-Dashboard) — zeigt Mitglieder ohne Training > 30 Tage
  - Sortiert nach Inaktivitätsdauer
  - Rot-Markierung bei > 60 Tagen
  - Mailto-Quick-Action pro Zeile
- **Session-Teilnehmerliste** — Klick auf Session im Admin-Kalender zeigt jetzt alle Teilnehmer + Wartenliste
- **Admin-Wettkampf-Ansicht** — Im Mitglied-Edit-Panel sieht Owner die letzten 5 Turniere des Members
- **Mitglieder-Seite Fix** — Liste funktioniert jetzt bei `/admin/mitglieder` (Split-Query statt JOIN)

### Infrastruktur
- **31 neue Tests** (273 total) — Coverage für Competitions, Owner-Insights, Coach-Notes, Blog, Recurring-Sessions
- **Auto-Profile-Creation** — wenn User sich via Magic-Link anmeldet, wird Profil automatisch angelegt

---

## 📋 SQL-Migrations auszuführen (vor oder nach Deploy, Reihenfolge egal)

### 1. Backfill missing profiles
```sql
INSERT INTO profiles (id, full_name, email, role, language)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
       u.email, 'member', 'de'
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
```

### 2. Coach Notes
Datei: `supabase/migrations/20260421_coach_notes.sql`

### 3. Competitions
Datei: `supabase/migrations/20260421_competitions.sql`

### 4. Leads Unique Email
Datei: `supabase/migrations/20260421_leads_unique_email.sql`

---

## 💡 Brainstorm — weitere Ideen für kommende Sessions

### Must-Have für ernsthaften Betrieb
1. **Stripe-Integration** — Online-Mitgliedschaft bezahlen, SEPA-Mandat, Rechnungen
2. **Passwort-Reset** — *bereits auf main PR #17*, muss beim Merge konfliktfrei übernommen werden
3. **DSGVO-Download-Button** — User kann seine Daten als ZIP exportieren (Pflicht nach EU-Recht)
4. **Account-Löschen** — User kann Account löschen → alle Daten anonymisieren

### Retention & Conversion
5. **Email-Sequenzen** — nach Trial-Anmeldung Serie: Tag 0, 2, 5 Follow-Ups
6. **Mitglieds-Monats-Report** — Mitglied bekommt monatlich Email mit Trainings-Stats + Motivation
7. **Referral-System** — "Freund einladen" → Credit bei beidem
8. **Leaderboard** — Top-10 Mitglieder mit meisten Trainings diesen Monat (öffentlich im Dashboard)

### Coaching
9. **Coach-Lektions-Plan** — Coaches können vor Training Technik-Plan eintragen, nach Training Notiz
10. **Private Schülerprofile** — Coach sieht bei jedem Mitglied: Stärken, Schwächen, Progress-Goals
11. **Technik-Bibliothek** — Coach markiert welche Techniken ein Mitglied beherrscht (Belt-Readiness-Check)
12. **Sparring-Matcher** — System schlägt basierend auf Gürtel+Gewicht passende Sparring-Partner vor

### Events & Community
13. **Seminar-Ankündigungen** — Admin postet Gast-Seminar, Mitglieder können anmelden
14. **Rolling-Out-Calendar** — wer kommt heute zum Open-Mat? (Social)
15. **Team-Wettkämpfe** — Turnier-Anmeldungen gebündelt verwalten (wer fährt mit, Gewichtsklassen)
16. **Team-Chat / Feed** — Interner News-Feed (Glückwünsche, Turnier-Ergebnisse)

### Admin-Automation
17. **Bulk-CSV-Import** für Leads/Mitglieder (Migration von Excel)
18. **Bulk-Email** — Owner kann alle Mitglieder auswählen + Nachricht schicken
19. **Automatische Belt-Promotion-Vorschläge** — basierend auf Trainings-Anzahl + Zeit
20. **Audit-Log** — alle Owner/Coach-Aktionen werden geloggt (wer hat was wann geändert)

### Analytics
21. **Cohort-Retention-Chart** — wieviel % bleiben nach 3, 6, 12 Monaten dabei
22. **Revenue-Report** — echte Zahlen statt Schätzung (nach Stripe-Integration)
23. **Coach-Performance** — Anwesenheit pro Coach, Retention der Schüler pro Coach
24. **Export als PDF** — Monatsberichte als PDF für Steuerberater

### Mobile / Offline
25. **PWA** — App-Icon auf Homescreen, offline-fähiger Check-In
26. **Push-Notifications** — Web-Push für Trainings-Erinnerungen
27. **Native iOS/Android** — wenn Web-Version stabil läuft, mit Capacitor/Expo umsetzen

---

## 🎯 Empfohlener Fokus nach dem Deploy

1. **Zuerst:** Backfill-SQL ausführen → Mitglieder sehen
2. **Dann:** Testen dass alle neuen Features funktionieren
3. **Danach:** Password-Reset PR #17 + Hero-Slider PR #18 mergen
4. **Strategisch:** Stripe-Integration (Business-Kritikalität Nummer 1)
5. **Nachhaltig:** DSGVO-Compliance (Download + Löschung)
