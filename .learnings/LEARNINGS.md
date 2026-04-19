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
