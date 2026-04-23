'use client'

import { useState } from 'react'
import { ArrowRight, MapPin, Navigation, Train, Car, ParkingCircle } from 'lucide-react'
import gymConfig from '@/gym.config'

interface DirectionsSectionProps {
  address: string
  postalCode?: string
  city?: string
  publicTransport?: string
  parking?: string
  mapEmbedUrl?: string
  mapLink?: string
}

/**
 * Clickable Anfahrt section with Google Maps embed + directions form.
 * User enters their starting address → opens Google Maps with directions to the gym.
 */
export function DirectionsSection({
  address,
  postalCode,
  city,
  publicTransport,
  parking,
  mapEmbedUrl,
  mapLink,
}: DirectionsSectionProps) {
  const [userAddress, setUserAddress] = useState('')

  const destination = [address, postalCode, city].filter(Boolean).join(', ')
  const encodedDest = encodeURIComponent(destination)

  // Default embed URL — no API key needed (Google Maps shareable iframe)
  const embedUrl =
    mapEmbedUrl ||
    `https://www.google.com/maps?q=${encodedDest}&output=embed`

  const openMapsLink = mapLink || `https://www.google.com/maps/search/?api=1&query=${encodedDest}`

  function handleDirections(e: React.FormEvent) {
    e.preventDefault()
    const origin = encodeURIComponent(userAddress.trim())
    if (!origin) return
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodedDest}&travelmode=transit`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="anfahrt" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Anfahrt
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            SO FINDEST DU UNS
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left — address + directions form + transport info */}
          <div className="flex flex-col justify-between gap-8 border border-border bg-card p-6 sm:p-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <MapPin size={14} /> Adresse
              </p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-primary sm:text-3xl">
                {address.toUpperCase()}
              </h3>
              {(postalCode || city) && (
                <p className="mt-1 text-lg font-black text-primary">
                  {[postalCode, city?.toUpperCase()].filter(Boolean).join(' ')}
                </p>
              )}

              <a
                href={openMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground underline underline-offset-4 hover:text-primary"
              >
                In Google Maps öffnen <ArrowRight size={14} />
              </a>
            </div>

            {/* Directions form */}
            <form onSubmit={handleDirections} className="flex flex-col gap-2">
              <label htmlFor="user-address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Route berechnen
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="user-address"
                  type="text"
                  value={userAddress}
                  onChange={e => setUserAddress(e.target.value)}
                  placeholder="Deine Adresse (z.B. Stephansplatz, Wien)"
                  className="flex-1 border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!userAddress.trim()}
                  className="inline-flex items-center justify-center gap-1.5 bg-primary px-5 py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Navigation size={14} /> Route
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Öffnet Google Maps mit der Route vom Eingabeort zum Gym.
              </p>
            </form>

            {/* Public transport + parking */}
            {(publicTransport || parking) && (
              <div className="space-y-4 border-t border-border pt-6">
                {publicTransport && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Train size={14} /> Öffentlich
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{publicTransport}</p>
                  </div>
                )}
                {parking && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Car size={14} /> Auto / Parken
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{parking}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — clickable embedded map */}
          <a
            href={openMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-[4/3] overflow-hidden border border-border bg-card md:aspect-auto md:min-h-[500px]"
            aria-label={`${gymConfig.name} auf Google Maps öffnen`}
          >
            <iframe
              src={embedUrl}
              title={`${gymConfig.name} — Karte`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none absolute inset-0 h-full w-full grayscale transition-all duration-500 group-hover:grayscale-0"
              allowFullScreen
            />
            {/* Click hint overlay */}
            <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="m-4 flex items-center gap-2 bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg">
                <Navigation size={14} /> Karte öffnen
              </div>
            </div>
            {/* Static pin overlay for visual clarity */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="relative">
                <MapPin size={48} className="fill-primary text-primary drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
