# Learnings

---

## [LRN-20260419-001] best_practice

**Logged**: 2026-04-19T00:00:00Z
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
`as any` und `Record<string, unknown>` in Supabase-Actions maskierten echte Typfehler — Supabase-Client war bereits korrekt mit `Database` typisiert.

### Details
In `app/actions/members.ts`, `app/actions/admin.ts` und `app/actions/bookings.ts` wurden Supabase-Responses als `Record<string, unknown>` annotiert und alle Felder manuell gecastet (`s.id as string`, `s.cancelled as boolean` usw.). Ursache: `payload` war als `Record<string, unknown>` typisiert, was nicht zum `.update()`-Typ passte. Statt den Payload richtig zu typisieren, wurde `supabase.from('profiles') as any` verwendet.

Der Supabase-Client (`createServerClient<Database>`) hatte durchgehend korrekte Typinferenz — die Casts waren vollständig unnötig und verhinderten, dass TypeScript echte Fehler (z.B. falscher Feldtyp, nullable field) erkennen konnte.

### Suggested Action
- Payload-Typen explizit definieren (z.B. `{ full_name?: string; phone?: string | null }`) statt `Record<string, unknown>`
- `Record<string, unknown>` nie als `.map()`-Callback-Parameter verwenden wenn Supabase-Inferenz vorhanden
- Role-Narrowing mit `!== 'coach' && !== 'owner'` statt `!['coach','owner'].includes(role)` für echte TypeScript-Narrowing

### Resolution
- **Resolved**: 2026-04-19
- **Notes**: Alle `as any`, `Record<string, unknown>`, und redundante Notification-Casts entfernt. `tsc --noEmit` ohne Fehler.

### Metadata
- Source: conversation
- Related Files: app/actions/members.ts, app/actions/admin.ts, app/actions/bookings.ts
- Tags: supabase, typescript, type-safety, as-any
- Pattern-Key: harden.supabase-typed-payload

---

## [LRN-20260420-001] best_practice

**Logged**: 2026-04-20
**Priority**: critical
**Status**: resolved
**Area**: backend

### Summary
Generische Fehlermeldungen ("Speichern fehlgeschlagen.") + `as any` Casts verbargen echte Supabase-Fehler monatelang. Der tatsächliche Grund war: die `gym_settings` Tabelle existierte nie in der Produktions-DB (Migration nie ausgeführt).

### Details
**Ursachen-Kaskade:**
1. Migration `20260418_gym_settings.sql` wurde im Repo committet aber nie in Supabase ausgeführt
2. `(supabase.from('gym_settings') as any).update(...)` hat zur Compile-Zeit keinen Fehler produziert
3. Runtime-Fehler `Could not find the table 'public.gym_settings' in the schema cache` wurde von `if (error) return { error: 'Speichern fehlgeschlagen.' }` maskiert
4. User sah nur "Speichern fehlgeschlagen" — keine Möglichkeit, die Ursache zu diagnostizieren

### Suggested Action
**Regel für ALLE Server-Actions:**
```typescript
if (error) {
  console.error('[action-name] error:', error)  // server logs
  return { error: `Speichern fehlgeschlagen: ${error.message}` }  // user sees real cause
}
```

**Deployment-Checkliste nach jeder Migration:**
- Migration auf Supabase ausführen (nicht nur im Repo)
- Mit echtem Testuser ein Feature testen das die Tabelle nutzt

### Resolution
- **Resolved**: 2026-04-20
- **Notes**: Alle Actions haben jetzt echte Fehlermeldungen + `console.error` für Server-Logs. Migration wurde manuell im Supabase SQL Editor ausgeführt.

### Metadata
- Source: user_feedback
- Related Files: app/actions/gym-settings.ts, app/actions/bot-link.ts, app/actions/promotions.ts
- Tags: supabase, migrations, error-messages, debugging, as-any
- Pattern-Key: harden.error-message-transparency

---

## [LRN-20260421-001] best_practice

**Logged**: 2026-04-21
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
Supabase SQL Editor kann PL/pgSQL-Funktionen mit lokalen Variablen (`DECLARE` + `SELECT INTO`) in bestimmten Fällen fehlinterpretieren — Fehler: `relation "v_variable_name" does not exist`. Workaround: `LANGUAGE sql` mit CTEs statt `LANGUAGE plpgsql` nutzen wann immer möglich.

### Details
Beim Ausführen einer `LANGUAGE plpgsql` Funktion mit `DECLARE v_foo int; BEGIN SELECT ... INTO v_foo ...` wirft Supabase SQL Editor den Fehler `42P01: relation "v_foo" does not exist`. Die exakt gleiche Syntax funktioniert mit `book_class`, schlägt aber bei `promote_waitlist` fehl — vermutlich ein Parser-Edge-Case.

**Lösung:** Funktion in `LANGUAGE sql` neu schreiben mit CTEs (`WITH ... AS`). Das umgeht PL/pgSQL komplett und wird vom Editor zuverlässig geparst.

### Suggested Action
- Bei atomaren Multi-Step-Operationen zuerst `LANGUAGE sql` + CTEs versuchen
- PL/pgSQL nur wenn wirklich nötig (komplexe Logik, FOR UPDATE Locks, EXCEPTION Handling)
- Bei Supabase-Migration-Problemen: Syntax zuerst via MCP `execute_sql` gegen Test-DB validieren
- Dollar-Tag `$function$` statt `$$` verwenden (Supabase-Konvention)

### Resolution
- **Resolved**: 2026-04-21
- **Notes**: `promote_waitlist` von PL/pgSQL auf SQL-CTEs umgeschrieben. Nutzt `WITH promoted AS (UPDATE ... RETURNING)` für die Promotion und eine zweite CTE für die Positions-Dekrementierung. Atomarität bleibt erhalten (einzelne Transaktion).

### Metadata
- Source: user_feedback
- Related Files: supabase/migrations/20260421_promote_waitlist_rpc.sql
- Tags: supabase, plpgsql, sql-editor, migrations, parser-edge-case
- Pattern-Key: supabase.prefer-sql-over-plpgsql

---

## [LRN-20260421-002] project

**Logged**: 2026-04-21
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
Supabase Auth erstellt **kein** automatisches Profil in `public.profiles` — ohne Trigger oder Callback-Handler fehlen Profile komplett, und Users verschwinden aus allen Role-basierten Queries (`.eq('role', 'member')`).

### Details
AXISJJ-Bug-Report: Users `mbelgatto@gmail.com` und `nimmmeinauto@gmail.com` waren in Supabase Auth sichtbar, aber `/admin/mitglieder` zeigte 0 Mitglieder. Ursache:
1. AXISJJ hat keinen `on_auth_user_created`-Trigger
2. Auth-Callback versuchte nur Profil zu LESEN, nicht zu erstellen
3. Users mit Magic-Link-Signup landeten in `auth.users` ohne `profiles`-Eintrag
4. Alle Queries `.from('profiles').eq('role', 'member')` gaben 0 Ergebnisse zurück

### Suggested Action
Bei jedem Supabase-Projekt mit Auth: **einen von beiden Mechanismen** etablieren:

**Option A — DB-Trigger (robuster):**
```sql
CREATE FUNCTION handle_new_user() RETURNS trigger SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email, 'member');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Option B — Auth-Callback-Handler (flexibler, app-controlled):**
Im `/auth/callback/route.ts` nach erfolgreicher Session: Profil prüfen, anlegen falls fehlt.

### Resolution
- **Resolved**: 2026-04-21
- **Notes**: Option B gewählt (weniger DB-Magic). Auch Backfill-SQL für existierende orphan auth.users hinzugefügt.

### Metadata
- Source: user_feedback
- Related Files: app/auth/callback/route.ts, supabase/migrations/20260421_backfill_missing_profiles.sql
- Tags: supabase, auth, profiles, trigger, magic-link
- Pattern-Key: supabase.auto-create-profile

---

## [LRN-20260420-001] best_practice

**Logged**: 2026-04-20T00:00:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
Vor Push auf `main` immer `git fetch` + Divergenz-Check — parallel gepushte Commits von anderem Gerät/Kollaborator führen sonst zu Rebase-Konflikten mitten im Deploy-Flow.

### Details
In dieser Session war `main` lokal auf f2fb740, Remote hatte zwischenzeitlich 5 neue Commits (PillNav-Variante, Admin-Berichte-Feature, Logo-Updates). Push wurde rejected, Rebase produzierte Konflikt in `NavBar.tsx`, und es war unklar ob die Remote-Arbeit vom User oder Kollaborator stammte.

Root-Cause: Session startete ohne `git fetch`. Tools wie `git status` zeigen nur den lokalen Stand — nicht was auf `origin/main` zwischenzeitlich dazugekommen ist.

### Suggested Action
- Bei Session-Start oder vor Commit/Push: `git fetch && git status -uno` laufen lassen
- Bei Divergenz vor Push: User fragen welche Seite gewinnt, NICHT stumm rebasen/überschreiben
- Vor `git reset --hard origin/main` immer lokale Commits als Branch sichern (`git branch backup-name <sha>`) — Stash reicht nicht für Commits
- Bei Cherry-Pick-Konflikt: `git checkout --theirs <file>` nimmt die Version aus dem gepickten Commit (nicht die aus dem aktuellen Branch)

### Metadata
- Source: conversation
- Related Files: -
- Tags: git, deploy, divergence, rebase, cherry-pick

---
