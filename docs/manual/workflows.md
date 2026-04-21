# Workflows — Schritt-für-Schritt

Die wichtigsten Abläufe in der Plattform.

---

## 1. Neues Mitglied aufnehmen

**Rolle:** Owner

1. Mitglied meldet sich via Landing Page (Lead wird erstellt) oder direkt im Gym
2. Owner öffnet **Leads** → verschiebt Lead auf "Kontaktiert"
3. Mitglied besucht Probetraining
4. Owner öffnet **Mitglieder** → Profil erstellen (falls neu)
5. Unter **Einstellungen → Preise** Abo-Plan wählen
6. Abonnement wird manuell in der Datenbank oder über das Admin-UI angelegt
7. Lead wird auf "Konvertiert" gesetzt

---

## 2. Coach einstellen

**Rolle:** Owner

1. Neue Person erstellt ein Mitglieder-Konto (via Registrierung oder Owner legt Profil an)
2. Owner öffnet **Einstellungen → Rollen**
3. Mitglied auswählen → Rolle auf **Coach** ändern
4. Automatisch: Eintrag in `coach_profiles` wird angelegt (leer)
5. Owner öffnet **Mitglieder** → Coach-Profil bearbeiten:
   - **Spezialisierung** (z.B. "Gi · No-Gi · Wrestling Coach")
   - **Bio** (2–3 Sätze öffentliche Beschreibung)
   - **Erfolge** (Turnier-Medaillen, Titel)
   - **Reihenfolge** (für Landing-Page-Slider — niedrigere Zahl = zuerst)
   - **Auf Landing Page anzeigen** aktivieren
6. Speichern → Coach erscheint auf der öffentlichen Landing Page

---

## 3. Tägliche Check-In-Routine

**Rolle:** Coach oder Owner

1. **Vor der Klasse**: Coach öffnet **Dashboard** → sieht nächste Klasse + Kapazität
2. Coach wechselt zu **Check-In**
3. Mitglieder kommen ins Gym:
   - Mitglied zeigt **QR-Code** am Handy (vom Dashboard)
   - Coach scannt → automatischer Check-In
   - Alternative: Coach sucht manuell per Name
4. Nach der Klasse: **Coach-Notizen** unter der Session eintragen:
   - Was wurde trainiert (Plan)
   - Reflexion (was lief gut)

---

## 4. Turnier organisieren

**Rollen:** Coach, Owner, Mitglieder

### Phase 1: Coach erstellt Turnier
1. Coach öffnet **Turniere** → **+ Neues Turnier**
2. Füllt aus: Name, Datum, Ort, Typ (intern/extern), Anmeldeschluss
3. Speichern → Status: **Ausstehend**

### Phase 2: Owner genehmigt
1. Owner öffnet **Turniere** → sieht pending Turnier
2. Klick **✓ Genehmigen** → Status: **Genehmigt**
3. Turnier erscheint für Mitglieder + auf Landing Page

### Phase 3: Mitglieder melden sich an
1. Mitglied öffnet **Turniere** (Member-Dashboard)
2. Klickt **Anmelden** auf der Turnier-Karte
3. Gibt Gewichtsklasse, Gi/No-Gi, Notizen an
4. Senden → Status: **Ausstehend**

### Phase 4: Coach prüft Anmeldungen
1. Coach öffnet **Turniere** → klick **Anmeldungen** auf dem Turnier
2. Liste aller Anmeldungen
3. Pro Mitglied: **✓ Bestätigen** oder **✗ Ablehnen**
4. Bestätigte Teilnehmer erscheinen im Landing-Page-Slider

### Phase 5: Nach dem Turnier (optional)
- Wettkampfergebnisse können unter **Mitglieder → [Mitglied] → Wettkämpfe** eingetragen werden (personal competitions record)

---

## 5. Neue Klasse zum Stundenplan hinzufügen

**Rolle:** Coach oder Owner

### Schritt 1: Klassentyp anlegen (falls neu)
**Nur Owner:**
1. Einstellungen → Klassentypen → **+ NEU**
2. Name (z.B. "Wrestling"), Level, Gi (false für Wrestling)
3. **Bild**: Datei hochladen oder URL einfügen
4. Speichern

### Schritt 2: Session erstellen
**Coach oder Owner:**
1. Training → **+ Neue Session**
2. Klassentyp wählen
3. Datum/Zeit, Kapazität, Ort
4. Wiederkehrend? → wählt Tage
5. Coach-ID = wer unterrichtet
6. Speichern → Session sichtbar im Kalender, Mitglieder können buchen

---

## 6. Gurt-Promotion

**Rolle:** Owner

1. Gürtel → Eligibility-Check: welches Mitglied ist bereit?
   - Zeit im aktuellen Gurt
   - Anzahl der Trainings
2. Mitglied auswählen → **Promote**
3. Nächster Gurt wird zugewiesen, promoted_at = heute
4. Eintrag erscheint in `profile_ranks` + Promotion-Historie
5. Mitglied sieht neuen Gurt auf seinem Dashboard
6. Optional: Badge "Belt-Promotion" wird automatisch vergeben (XP-Bonus)

---

## 7. Admin-Dashboard-Übersicht lesen

**Rolle:** Owner

Dein Dashboard zeigt jetzt die **Coach-Ansicht** (Klassen, Zeitplan, Check-Ins).

Für Business-Metriken:
- **Berichte** → Umsatz, Konversionsrate, Auslastung, Top-Klassen, Inaktive Mitglieder

Für Mitglieder-Management:
- **Mitglieder** → aktive Abos, Promotions, Wettkämpfe

Für Marketing:
- **Leads** → Interessenten-Pipeline
- **Blog** → Content-Planung
- **Hero** → Landing-Page-Highlights

---

## 8. Mitglied kündigt / Abo pausiert

**Rolle:** Owner

1. Mitglieder → Mitglied auswählen
2. **Abo-Panel** → Status ändern auf **paused** oder **cancelled**
3. System stoppt automatisch die Abrechnung
4. Mitglied bleibt im System (Historie bleibt)
5. Kann später reaktiviert werden
