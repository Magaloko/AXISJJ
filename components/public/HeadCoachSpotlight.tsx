import Image from 'next/image'
import type { CoachPublicProfile } from '@/app/actions/public-coaches'

interface Props {
  coach: CoachPublicProfile
}

// Belt progression for the classic visual
const BELT_BAR = [
  { name: 'White',  color: '#e5e7eb' },
  { name: 'Blue',   color: '#1d4ed8' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Brown',  color: '#78350f' },
  { name: 'Black',  color: '#111111', border: '#dc2626' },
]

export function HeadCoachSpotlight({ coach }: Props) {
  return (
    <section id="head-coach" className="bg-[#0a0a0a] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
          Team · Coach
        </p>

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">

          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px flex-1 max-w-[60px] bg-red-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                Head Coach{coach.beltName ? ` · ${coach.beltName}` : ''}
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-black leading-tight text-white sm:text-5xl uppercase">
              {coach.name}
            </h2>

            {coach.specialization && (
              <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-red-600/80">
                {coach.specialization}
              </p>
            )}

            {coach.bio && (
              <div className="space-y-4 text-gray-400">
                {coach.bio.split(/\n\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {coach.achievements && (
              <div className="mt-6 border-l-2 border-red-600/60 pl-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-2">Erfolge</p>
                <div className="text-sm text-gray-400">
                  {coach.achievements.split(/\n/).filter(Boolean).map((line, i) => (
                    <p key={i}>• {line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Belt progression */}
            <div className="mt-8 flex items-center gap-2">
              {BELT_BAR.map(b => (
                <div
                  key={b.name}
                  title={b.name + ' Belt'}
                  className="h-2 flex-1 rounded-sm"
                  style={{
                    background: b.color,
                    border: b.border ? `1px solid ${b.border}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 h-full w-3/4 bg-red-600/10 blur-2xl" />
            <div className="relative overflow-hidden">
              {coach.avatarUrl ? (
                <Image
                  src={coach.avatarUrl}
                  alt={`${coach.name} — Head Coach AXIS Jiu-Jitsu Vienna`}
                  width={600}
                  height={500}
                  className="w-full object-cover object-top"
                />
              ) : (
                <Image
                  src="/images/coach-banner.jpg"
                  alt={`${coach.name} — Head Coach AXIS Jiu-Jitsu Vienna`}
                  width={600}
                  height={500}
                  className="w-full object-cover object-top"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
