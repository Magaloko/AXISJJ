# Owner / Head Coach — Bedienungsanleitung

Als Owner (Head Coach) hast du vollen Zugriff auf alle Funktionen.

## Zugang

Als Owner wirst du nach dem Login automatisch zum Admin-Dashboard geleitet.

## Navigation

Dein Dashboard zeigt dieselbe Coach-Ansicht (Klassen, Zeitplan, Check-Ins) — **du bist gleichzeitig Head Coach**. Business-Metriken findest du unter **Berichte**.

### Desktop-Seitenleiste

Aufgeteilt in 5 Bereiche:

**OPS** (täglich):
- Dashboard
- Check-In
- Training
- Turniere

**Mitglieder**:
- Mitglieder
- Gürtel
- Leads

**Business**:
- Berichte

**Content**:
- Blog
- Curriculum
- Hero Slider

**System**:
- Gym
- Einstellungen
- Audit-Log

### Mobile (unten)

4 primäre Tabs + **Mehr ··· Button**:
- Dashboard · Mitglieder · Check-In · Berichte · Mehr
- **Mehr**-Sheet: Turniere, Gürtel, Leads, Blog, Curriculum, Hero, Gym, Einstellungen, Audit-Log

## Alle Coach-Funktionen

Alles was [der Coach](./coach.md) kann — Dashboard, Check-In, Training/Sessions, Turniere-Erstellung, Anmeldungen prüfen — kannst du auch.

## Mitgliederverwaltung

**Mitglieder** → Liste aller Mitglieder.

### Mitglieder-Details
Klick auf ein Mitglied → Seitenpanel mit:
- Profildaten (Name, Telefon, Geburtsdatum)
- **Rolle ändern** (siehe Einstellungen → Rollen)
- **Abo** (aktiv / pausiert / abgelaufen)
- **Trainings-Fortschritt**
- **Wettkampf-Historie** (personal competitions table)
- **Skills** (du kannst Skills markieren)
- **Coach-Notizen** (privat, nur für Coaches sichtbar)
- **Website-Profil** (nur wenn Rolle = coach/owner): Bio, Spezialisierung, Erfolge, auf Landing Page anzeigen

### Mitglied zu Coach machen
1. Mitglieder → Mitglied wählen
2. (via Einstellungen → Rollen): Rolle ändern von `member` zu `coach`
3. Automatisch wird ein `coach_profiles` Eintrag erstellt
4. Klick nochmal auf das Mitglied → **Website-Profil** Sektion erscheint
5. Fülle Bio + Erfolge aus
6. Aktiviere **Auf Landing Page anzeigen**
7. Speichern → Coach erscheint in der öffentlichen Slider

### Head Coach (Shamsudin)
Immer sichtbar auf der Landing Page — ist als `is_pinned` markiert in der DB. Diese Einstellung wird NICHT überschrieben wenn "Auf Landing Page anzeigen" ausgeschaltet wird.

## Turniere

Alle Coach-Funktionen + zwei Extras:

### Turnier genehmigen
Wenn ein Coach ein neues Turnier erstellt → Status `pending_approval`.
- In der Turnier-Liste siehst du einen gelben **Ausstehend**-Badge
- **✓ Genehmigen** Button erscheint nur für Owner
- Nach Genehmigung: Status `approved` → öffentlich sichtbar, Mitglieder können sich anmelden

### Turnier direkt erstellen
Wenn DU ein Turnier erstellst → geht direkt auf `approved` (keine Selbst-Genehmigung nötig).

### Jedes Turnier bearbeiten/absagen
Du kannst jedes Turnier jeden Status bearbeiten. Coaches dürfen nur ihre eigenen pending Turniere bearbeiten.

## Gürtel (Promotions)

**Gürtel** → Promotion-Management:
- Mitglieder auflisten mit aktuellem Gurt
- Eligibility-Check: wer ist "bereit" (Zeit + Sessions erfüllt)?
- **Promote**: Mitglied zum nächsten Gurt befördern
- Historie der Beförderungen

## Leads (CRM)

**Leads** → Interessenten-Kanban-Board:
- Spalten: Neu · Kontaktiert · Konvertiert · Verloren
- Drag-and-Drop zwischen Status
- Kontaktaufnahme (E-Mail / Telefon)

## Blog

**Blog** → Blog-Posts verwalten:
- Erstellen, bearbeiten, publizieren
- Markdown-Support
- Kategorie, Cover-Image

## Curriculum

**Curriculum** → BJJ-Lehrplan:
- Monats-Fokus, Wochen-Themen
- Techniken pro Session
- Seed für Month 1 Foundations ist bereits geladen

## Berichte

**Berichte** → Business-Metriken:
- Umsatz (aktuelle Aktive Abos)
- Umsatz vs. Vormonat (%)
- Lead-Konversion (%)
- Ø Klassen-Auslastung (30 Tage)
- Top-Klassen nach Attendance
- Inaktive Mitglieder (nicht trainiert in 30 Tagen)
- Utilization-Chart (8-Wochen-Trend)

## Hero Slider

**Hero** → Landing-Page-Slider verwalten:
- Neue Slides anlegen (Bild, Titel, Subtitle, CTA)
- Aktiv / Inaktiv schalten
- Reihenfolge per `display_order`

## Gym

**Gym** → allgemeine Gym-Info:
- Name, Adresse, Telefon, E-Mail
- Öffnungszeiten
- Richtlinien (Waiver, Hausordnung)

## Einstellungen

**Einstellungen** → zentrale Konfiguration:

### Klassentypen
- Name, Level, Gi/No-Gi
- **Bild**: Upload oder URL einfügen
- Neue Typen anlegen (z.B. Wrestling, MMA, Boxing)
- **Klassentyp bearbeiten**: Name ändern, Bild austauschen

### Preise
- Preispläne verwalten (students / adults / kids)
- Laufzeit + Preis pro Monat
- Highlighted = Empfehlung

### Rollen
- Mitglied → Coach befördern (oder umgekehrt)
- Owner-Rolle ist nicht über UI änderbar (nur via DB)

## Audit-Log

**Audit-Log** → alle administrativen Aktionen:
- Wer hat wann was geändert?
- Filter nach Aktion-Typ
- Filter nach Mitglied / Coach
- Nützlich bei Streitigkeiten oder Fehlersuche

## Landing Page

Die öffentliche Website zeigt:
- Hero-Slider (steuerbar in /admin/hero)
- Stats-Bar (Mitglieder, Jahre, etc.)
- **Coach-Slider** (steuerbar via Mitglieder → Website-Profil)
- **Tournament-Section** (wenn aktive Turniere genehmigt sind)
- Programs-Grid (Klassentypen)
- Pricing
- Wochen-Schedule
- Blog-Posts
