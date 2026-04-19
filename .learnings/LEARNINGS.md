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
