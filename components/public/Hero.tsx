'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HeroSlide } from '@/app/actions/hero-slides'

function TextSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative flex min-h-screen w-full flex-shrink-0 items-center bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {slide.eyebrow && (
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-primary">
            {slide.eyebrow}
          </p>
        )}
        <h1
          className="mb-6 font-black leading-[0.9] tracking-tighter text-foreground"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 8rem)' }}
        >
          {(slide.headline ?? []).map((line, i) => (
            <span key={i} className={'block ' + (i === (slide.headline?.length ?? 0) - 1 ? 'text-primary' : '')}>
              {line}
            </span>
          ))}
        </h1>
        {slide.subtext && (
          <p className="mb-2 max-w-md text-lg text-muted-foreground" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            {slide.subtext}
          </p>
        )}
        {slide.subtext2 && <p className="mb-2 text-sm text-muted-foreground">{slide.subtext2}</p>}
        {slide.address && <p className="mb-10 text-sm text-muted-foreground">{slide.address}</p>}
        <div className="flex flex-wrap items-center gap-4">
          {slide.cta_primary_label && slide.cta_primary_href && (
            <Link href={slide.cta_primary_href} className="inline-block bg-primary px-8 py-4 text-sm font-black tracking-widest text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105">
              {slide.cta_primary_label}
            </Link>
          )}
          {slide.cta_secondary_label && slide.cta_secondary_href && (
            <a href={slide.cta_secondary_href} className="inline-block border border-border px-8 py-4 text-sm font-semibold tracking-wider text-foreground transition-colors hover:border-foreground/50">
              {slide.cta_secondary_label}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PromoSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative flex min-h-screen w-full flex-shrink-0 items-end overflow-hidden bg-[#111]">
      {slide.image_url && (
        <Image src={slide.image_url} alt={slide.image_alt ?? ''} fill className="object-cover object-center opacity-90" priority sizes="100vw" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 w-full px-6 pb-16 sm:px-12 sm:pb-20">
        {slide.badge_label && <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-400">{slide.badge_label}</p>}
        {slide.tag_label && (
          <div className="mb-4 inline-block bg-primary px-4 py-1.5">
            <p className="text-sm font-black italic tracking-wide text-white">{slide.tag_label}</p>
          </div>
        )}
        {(slide.offers ?? []).length > 0 && (
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {(slide.offers ?? []).map((o, i) => (
              <span key={i} className={'inline-block ' + o.bg + ' px-4 py-2 text-sm font-black ' + o.text + ' shadow-lg'}>{o.label}</span>
            ))}
          </div>
        )}
        {slide.promo_headline && <h2 className="mb-2 text-2xl font-black italic text-white sm:text-3xl">{slide.promo_headline}</h2>}
        {slide.cta_label && slide.cta_href && (
          <Link href={slide.cta_href} className="inline-flex items-center gap-2 bg-primary px-8 py-4 text-sm font-black tracking-widest text-white transition-all hover:bg-primary/90 hover:scale-105">
            {slide.cta_label}
          </Link>
        )}
      </div>
    </div>
  )
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (paused || slides.length <= 1) return
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [next, paused, slides.length])

  if (slides.length === 0) return null

  return (
    <section className="relative flex min-h-screen overflow-hidden pt-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex w-full transition-transform duration-700 ease-in-out" style={{ transform: 'translateX(-' + current * 100 + '%)' }}>
        {slides.map(slide => slide.type === 'text' ? <TextSlide key={slide.id} slide={slide} /> : <PromoSlide key={slide.id} slide={slide} />)}
      </div>
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70" aria-label="Vorheriger Slide">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70" aria-label="Naechster Slide">
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={'h-2 rounded-full transition-all duration-300 ' + (i === current ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80')} aria-label={'Slide ' + (i + 1)} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
