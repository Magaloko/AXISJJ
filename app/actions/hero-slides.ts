'use server'

  import { createClient } from '@/lib/supabase/server'
    import { revalidatePath } from 'next/cache'

    export type HeroSlide = {
  id: string
  position: number
      is_active: boolean
      type: 'text' | 'promo'
      // text slide
      eyebrow?: string | null
      headline?: string[] | null
      subtext?: string | null
      subtext2?: string | null
      address?: string | null
      cta_primary_label?: string | null
      cta_primary_href?: string | null
      cta_secondary_label?: string | null
      cta_secondary_href?: string | null
      // promo slide
      image_url?: string | null
      image_alt?: string | null
      badge_label?: string | null
      badge_color?: string | null
      tag_label?: string | null
      offers?: { label: string; bg: string; text: string }[] | null
      promo_headline?: string | null
      cta_label?: string | null
      cta_href?: string | null
    }

    /** Public: fetch active slides ordered by position */
    export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })
      if (error) { console.error('getActiveHeroSlides:', error); return [] }
  return (data ?? []) as HeroSlide[]
    }

    /** Admin: fetch all slides */
    export async function getAllHeroSlides(): Promise<HeroSlide[]> {
      const supabase = await createClient()
      const { data, error } = await supabase
    .from('hero_slides')
        .select('*')
        .order('position', { ascending: true })
      if (error) { console.error('getAllHeroSlides:', error); return [] }
  return (data ?? []) as HeroSlide[]
    }

    /** Admin: create a new slide */
    export async function createHeroSlide(payload: Omit<HeroSlide, 'id'>): Promise<void> {
      const supabase = await createClient()
      const { error } = await supabase.from('hero_slides').insert(payload)
      if (error) throw new Error(error.message)
      revalidatePath('/')
      revalidatePath('/admin/hero')
    }

    /** Admin: update a slide */
    export async function updateHeroSlide(id: string, payload: Partial<Omit<HeroSlide, 'id'>>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('hero_slides').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
      revalidatePath('/')
      revalidatePath('/admin/hero')
    }

/** Admin: delete a slide */
export async function deleteHeroSlide(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('hero_slides').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/admin/hero')
  }

/** Admin: reorder – set positions in bulk */
export async function reorderHeroSlides(orderedIds: string[]): Promise<void> {
  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
        supabase.from('hero_slides').update({ position: index }).eq('id', id)
      )
    )
    revalidatePath('/')
    revalidatePath('/admin/hero')
  }

/** Admin: toggle active */
export async function toggleHeroSlideActive(id: string, is_active: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('hero_slides').update({ is_active }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/admin/hero')
  }
