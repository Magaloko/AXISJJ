# Coach — Bedienungsanleitung

Als Coach hast du Zugriff auf die Admin-Oberfläche für den täglichen Ablauf.

## Zugang

Du loggst dich normal ein und wirst automatisch zum Admin-Dashboard weitergeleitet (wegen deiner Rolle `coach`).

## Navigation (Admin)

### Desktop-Seitenleiste

Du siehst nur den **OPS-Bereich**:
- Dashboard
- Check-In
- Training
- Turniere

Management-Bereiche (Mitglieder, Leads, etc.) sind nur für Owner sichtbar.

### Mobile (unten)

4 Tabs: **Dashboard · Check-In · Training · Turniere**

## Dashboard

Dein Coach-Dashboard zeigt:
- **Stat-Streifen**: Klassen heute, Diese Woche, Meine Schüler (30 Tage), Check-Ins heute
- **Nächste Klasse**: Welche Session gleich ansteht, mit Kapazitäts-Balken
- **Heutiger Plan**: Alle Klassen von heute
- **Meine Schüler**: Welche Mitglieder dich in den letzten 30 Tagen getroffen haben
- **Coach-Zeitplan**: Deine Sessions heute

## Check-In

Gehe zu **Check-In** — der zentrale Ort wenn Mitglieder ins Gym kommen:

1. **QR-Code scannen** (wenn das Mitglied seinen QR zeigt) → automatischer Check-In
2. **Manuelles Suchen**: Name eingeben → Mitglied auswählen → Check-In
3. **Session auswählen**: der Check-In wird der aktuellen Session zugeordnet

Jeder Check-In:
- Gibt dem Mitglied XP
- Loggt die Attendance
- Wird im Audit-Log protokolliert

## Training / Klassen

**Training** zeigt:
- **Wochen-Kalender**: alle Sessions
- Klick auf eine Session → Details: Buchungen, Attendees
- **Neue Session**: Name, Datum/Zeit, Klassentyp, Ort, Kapazität, wiederkehrend?

### Wiederkehrende Sessions
Du kannst Sessions als **Weekly Recurring** markieren — sie werden automatisch für die nächsten Wochen angelegt.

### Session-Details / Attendees
Bei jeder Session siehst du:
- Buchungen (confirmed/waitlist)
- Check-Ins (wer tatsächlich da war)
- **Session-Notizen** (Trainingsplan, Reflexion)

### Coach-Notizen
Zu jeder Session kannst du **Notizen** speichern:
- **Plan**: was du unterrichten willst
- **Reflexion**: was lief gut, was nicht (nach der Session)

## Turniere

### Turnier erstellen
1. Gehe zu **Turniere**
2. **+ Neues Turnier**
3. Fülle aus:
   - Name
   - Datum (+ optional End-Datum für mehrtägige Events)
   - Ort
   - Typ: **Intern** (Gym-Event) oder **Extern** (IBJJF, nationales Turnier)
   - Beschreibung
   - Anmeldeschluss
4. **Speichern** → Status: **Ausstehend** (wartet auf Owner-Genehmigung)
5. Sobald der Owner genehmigt → Status: **Genehmigt** → sichtbar für alle

### Turnier bearbeiten
Nur im Status "Ausstehend" kannst du deine eigenen Turniere bearbeiten. Nach Genehmigung nur der Owner.

### Anmeldungen prüfen
Bei einem **genehmigten** Turnier → klick **Anmeldungen**:
- Liste aller Anmeldungen mit Name, Gewichtsklasse, Gi/No-Gi, Notizen
- Status: Ausstehend, Bestätigt, Abgelehnt
- Klick **✓ Bestätigen** oder **✗ Ablehnen**

Bestätigte Teilnehmer erscheinen automatisch auf der öffentlichen Landing Page (Teilnehmer-Slider).

### Turnier absagen
Falls ein Turnier nicht stattfindet → **Absagen** → Status `cancelled`. Mitglieder sehen es dann nicht mehr.

## Was du NICHT kannst

Diese Funktionen sind **nur für den Owner**:
- Mitglieder-Rollen ändern
- Mitglieder erstellen oder löschen
- Turniere genehmigen
- Preise / Abos / Gym-Einstellungen ändern
- Blog, Hero-Slider, Content
- Audit-Log ansehen
- Business-Berichte

Sprich mit dem Owner, wenn du eine dieser Aktionen brauchst.
