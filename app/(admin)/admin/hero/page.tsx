import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllHeroSlides } from '@/app/actions/hero-slides'
import { HeroSlidesAdmin } from './HeroSlidesAdmin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hero Slider verwalten | Admin',
}

export default async function HeroAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin/dashboard')

  const slides = await getAllHeroSlides()
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Hero Slider</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalte die Slides auf der Landing Page.
        </p>
      </div>
      <HeroSlidesAdmin initialSlides={slides} />
    </div>
  )
}
