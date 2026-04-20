# Class Type Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `image_url` to class types so the Head Coach can assign a cover image (file upload or URL paste), rename types, and add new types like Wrestling, Boxing, MMA.

**Architecture:** New `image_url` column on `class_types` table. A Supabase storage bucket `class-type-images` (public) handles file uploads via a server action. `ClassTypeForm` gains an image section with file-upload button and URL-paste fallback. `ClassTypeTable` shows a thumbnail. No new routes needed.

**Tech Stack:** Next.js 15, Supabase Storage, TypeScript, Tailwind CSS, Vitest

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/20260421_class_type_image.sql` | Add `image_url` column + storage bucket + RLS |
| `types/supabase.ts` | Add `image_url` to `class_types` Row/Insert/Update |
| `app/actions/class-types.schema.ts` | Add optional `image_url` to schema |
| `app/actions/class-types.ts` | Pass `image_url` through upsert |
| `app/actions/class-type-image.ts` | New: `uploadClassTypeImage(formData)` |
| `app/actions/__tests__/class-type-image.test.ts` | New: upload action tests |
| `components/admin/ClassTypeForm.tsx` | Add image upload + URL paste section |
| `components/admin/ClassTypeTable.tsx` | Show thumbnail in list |

---

## Task 1: Migration + Types

**Files:**
- Create: `supabase/migrations/20260421_class_type_image.sql`
- Modify: `types/supabase.ts`

### Step 1.1 — Create migration

- [ ] Create `supabase/migrations/20260421_class_type_image.sql`:

```sql
-- Add image_url to class_types
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS image_url text;

-- Storage bucket for class type images (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-type-images',
  'class-type-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for storage
CREATE POLICY "class_type_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'class-type-images');

-- Owner upload policy
CREATE POLICY "class_type_images_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'class-type-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owner delete policy
CREATE POLICY "class_type_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'class-type-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );
```

### Step 1.2 — Apply migration

- [ ] Apply via Supabase MCP or dashboard SQL editor.
- Expected: `class_types.image_url` column exists, `class-type-images` bucket created.

### Step 1.3 — Update `types/supabase.ts`

- [ ] Find the `class_types` entry in `types/supabase.ts` and add `image_url` to all three sub-types:

```ts
      class_types: {
        Row: { id: string; name: string; description: string | null; level: 'beginner' | 'all' | 'advanced' | 'kids'; gi: boolean; image_url: string | null }
        Insert: { id?: string; name: string; description?: string | null; level?: 'beginner' | 'all' | 'advanced' | 'kids'; gi?: boolean; image_url?: string | null }
        Update: Partial<Database['public']['Tables']['class_types']['Insert']>
        Relationships: []
      }
```

### Step 1.4 — Commit

- [ ] Run:
```bash
git add supabase/migrations/20260421_class_type_image.sql types/supabase.ts
git commit -m "feat: add image_url to class_types and create class-type-images storage bucket"
```

---

## Task 2: Upload Server Action

**Files:**
- Create: `app/actions/class-type-image.ts`
- Create: `app/actions/__tests__/class-type-image.test.ts`

### Step 2.1 — Write failing tests

- [ ] Create `app/actions/__tests__/class-type-image.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStorage = {
  from: vi.fn(),
}
const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
  storage: mockStorage,
}
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))

import { uploadClassTypeImage } from '../class-type-image'

function ownerChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null }),
  }
}

describe('uploadClassTypeImage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })

  it('returns error for non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'coach' }, error: null }),
    })
    const fd = new FormData()
    fd.append('file', new File(['x'], 'test.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns error when no file provided', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fd = new FormData()
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns error for non-image file', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const fd = new FormData()
    fd.append('file', new File(['x'], 'doc.pdf', { type: 'application/pdf' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBe('Nur Bilder erlaubt.')
  })

  it('returns error on storage upload failure', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: { message: 'storage error' } }),
      getPublicUrl: vi.fn(),
    }
    mockStorage.from.mockReturnValue(bucket)
    const fd = new FormData()
    fd.append('file', new File(['x'], 'img.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.error).toBeTruthy()
  })

  it('returns public URL on success', async () => {
    mockSupabase.from.mockReturnValueOnce(ownerChain())
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/img.jpg' } }),
    }
    mockStorage.from.mockReturnValue(bucket)
    const fd = new FormData()
    fd.append('file', new File(['x'], 'img.jpg', { type: 'image/jpeg' }))
    const result = await uploadClassTypeImage(fd)
    expect(result.url).toBe('https://cdn.example.com/img.jpg')
    expect(result.error).toBeUndefined()
  })
})
```

### Step 2.2 — Run tests to verify they fail

- [ ] Run: `npx vitest run app/actions/__tests__/class-type-image.test.ts`
- Expected: FAIL — module not found

### Step 2.3 — Implement `app/actions/class-type-image.ts`

- [ ] Create `app/actions/class-type-image.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { assertOwner } from '@/lib/auth'

export async function uploadClassTypeImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Keine Datei ausgewählt.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Datei zu groß (max 5 MB).' }
  if (!file.type.startsWith('image/')) return { error: 'Nur Bilder erlaubt.' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('class-type-images')
    .upload(path, file, { contentType: file.type })

  if (error) return { error: 'Upload fehlgeschlagen.' }

  const { data } = supabase.storage.from('class-type-images').getPublicUrl(path)
  return { url: data.publicUrl }
}
```

### Step 2.4 — Run tests to verify they pass

- [ ] Run: `npx vitest run app/actions/__tests__/class-type-image.test.ts`
- Expected: 5/5 PASS

### Step 2.5 — Commit

- [ ] Run:
```bash
git add app/actions/class-type-image.ts app/actions/__tests__/class-type-image.test.ts
git commit -m "feat: add uploadClassTypeImage server action"
```

---

## Task 3: Update Schema and Upsert Action

**Files:**
- Modify: `app/actions/class-types.schema.ts`
- Modify: `app/actions/class-types.ts`

### Step 3.1 — Update schema

- [ ] Open `app/actions/class-types.schema.ts`. Add `image_url` to the schema:

```ts
import { z } from 'zod'

export const classTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name ist Pflicht').max(100),
  description: z.string().max(500).optional(),
  level: z.enum(['beginner', 'all', 'advanced', 'kids']),
  gi: z.boolean(),
  image_url: z.string().url().nullable().optional(),
})
```

### Step 3.2 — Update `ClassTypeData` and `upsertClassType`

- [ ] Open `app/actions/class-types.ts`. Update `ClassTypeData`:

```ts
export type ClassTypeData = {
  id?: string
  name: string
  description?: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
  image_url?: string | null
}
```

- [ ] Update the `upsertClassType` function's supabase call to include `image_url`:

```ts
  const { error } = await supabase.from('class_types').upsert({
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    name: parsed.data.name,
    description: parsed.data.description?.trim() || null,
    level: parsed.data.level,
    gi: parsed.data.gi,
    image_url: parsed.data.image_url ?? null,
  })
```

### Step 3.3 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 3.4 — Run existing tests

- [ ] Run: `npx vitest run app/actions/__tests__/class-types.test.ts`
- Expected: all existing tests PASS (image_url defaults to null, no breakage)

### Step 3.5 — Commit

- [ ] Run:
```bash
git add app/actions/class-types.schema.ts app/actions/class-types.ts
git commit -m "feat: add image_url field to class type schema and upsert action"
```

---

## Task 4: Update ClassTypeForm and ClassTypeTable

**Files:**
- Modify: `components/admin/ClassTypeForm.tsx`
- Modify: `components/admin/ClassTypeTable.tsx`

### Step 4.1 — Update `ClassTypeRow` interface and form state

- [ ] Open `components/admin/ClassTypeForm.tsx`. Add `image_url` to the `ClassTypeRow` interface:

```ts
export interface ClassTypeRow {
  id?: string
  name: string
  description: string | null
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
  image_url?: string | null
}
```

- [ ] Add `useRef` to the React import:

```ts
import { useState, useTransition, useRef } from 'react'
```

- [ ] Add the upload action import after existing imports:

```ts
import { uploadClassTypeImage } from '@/app/actions/class-type-image'
```

### Step 4.2 — Add image state and upload handler inside `ClassTypeForm`

- [ ] Inside `ClassTypeForm`, add after the existing `const [isPending, startTransition] = useTransition()` line:

```ts
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)
    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadClassTypeImage(fd)
    setIsUploading(false)
    if (result.error) { setImageError(result.error); return }
    setImageUrl(result.url ?? '')
  }
```

### Step 4.3 — Pass `image_url` in the save call

- [ ] Find the `upsertClassType({...})` call inside `save()` and add `image_url`:

```ts
      const result = await upsertClassType({
        id: initial?.id,
        name: form.name,
        description: form.description ?? undefined,
        level: form.level,
        gi: form.gi,
        image_url: imageUrl || null,
      })
```

### Step 4.4 — Add image section to the form JSX

- [ ] Inside the form's `<div className="space-y-3">`, add the image section **before** the save/cancel buttons:

```tsx
        {/* Image */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Bild</label>
          {imageUrl && (
            <div className="mb-2 relative w-full h-32 overflow-hidden rounded border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Vorschau" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-1 right-1 bg-background/80 px-1 text-xs text-destructive border border-border"
              >
                ✕
              </button>
            </div>
          )}
          {imageError && <p className="mb-1 text-xs text-destructive">{imageError}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-border bg-background p-2 text-sm"
              placeholder="Bild-URL einfügen…"
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImageError(null) }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border border-border px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              {isUploading ? '…' : 'Upload'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
```

### Step 4.5 — Update `ClassTypeTable` to show thumbnail

- [ ] Open `components/admin/ClassTypeTable.tsx`. Find the `<li>` item rendering each class type. Add a thumbnail before the text:

```tsx
          <li key={t.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {t.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image_url} alt={t.name} className="h-10 w-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{labelForLevel(t.level)} · {t.gi ? 'Gi' : 'No-Gi'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(t)} className="border border-border px-2 py-1 text-[10px]">Edit</button>
              <button onClick={() => remove(t)} disabled={isPending}
                      className="border border-destructive px-2 py-1 text-[10px] text-destructive">✕</button>
            </div>
          </li>
```

Also update the `ClassTypeRow` type used in `ClassTypeTable` — since it's imported from `ClassTypeForm`, the `image_url` field is automatically available after Task 4.1.

### Step 4.6 — Add image_url to the einstellungen page query

- [ ] Open `app/(admin)/admin/einstellungen/page.tsx`, line 20. Change:

```ts
    supabase.from('class_types').select('id, name, description, level, gi').order('name'),
```

To:

```ts
    supabase.from('class_types').select('id, name, description, level, gi, image_url').order('name'),
```

### Step 4.7 — TypeScript check

- [ ] Run: `npx tsc --noEmit`
- Expected: no new errors

### Step 4.8 — Run tests

- [ ] Run: `npx vitest run`
- Expected: same baseline pass/fail

### Step 4.9 — Commit and push

- [ ] Run:
```bash
git add components/admin/ClassTypeForm.tsx components/admin/ClassTypeTable.tsx
git commit -m "feat: add image upload and URL paste to ClassTypeForm; show thumbnail in ClassTypeTable"
git push origin main
```
