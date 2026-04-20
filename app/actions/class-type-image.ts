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
