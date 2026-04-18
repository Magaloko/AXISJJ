---
date: 2026-04-17
project: AXISJJ
severity: high
tags: [supabase, typescript, database-types]
---

# Supabase Database types require `Relationships` for supabase-js v2.103+

## Problem

`tsc --noEmit` fails with errors like:
```
Property 'full_name' does not exist on type 'never'
Argument of type '{ ... }' is not assignable to parameter of type 'never'
```

All Supabase query results collapse to `never` when using `createClient<Database>()`.

## Root cause

`@supabase/supabase-js` v2.103+ uses PostgREST v12 internally. The `GenericTable` type now requires a `Relationships` field:

```typescript
type GenericTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: GenericRelationship[]  // ← REQUIRED — was missing from handwritten types
}
```

Without `Relationships`, the table type doesn't satisfy `GenericTable`, so the entire schema inference collapses to `never`.

Additionally, `Views: Record<string, never>` and `Enums: Record<string, never>` must be changed to `{ [_ in never]: never }` — the string index signature in `Record<string, never>` conflicts with the SDK's type resolution.

## Fix

1. Add `Relationships: []` to every table (or define actual FK relationships for join inference)
2. Define FK relationships on tables that use joins in queries (e.g., `class_sessions → class_types`)
3. Change `Views` and `Enums` from `Record<string, never>` to `{ [_ in never]: never }`

```typescript
class_sessions: {
  Row: { ... }
  Insert: ...
  Update: ...
  Relationships: [
    {
      foreignKeyName: "class_sessions_class_type_id_fkey"
      columns: ["class_type_id"]
      isOneToOne: false
      referencedRelation: "class_types"
      referencedColumns: ["id"]
    }
  ]
}
```

For reverse joins (`bookings!inner` on a `class_sessions` query), the `Relationships` must be on the **source** table (`bookings`), not on `class_sessions`.

## Better alternative

Use Supabase CLI to generate types automatically:
```bash
supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

This avoids the manual maintenance problem entirely.