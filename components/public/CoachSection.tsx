import Image from 'next/image'

export function CoachSection() {
  return (
    <section id="team" className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          Team · Coach
        </p>

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-2">

          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px flex-1 max-w-[60px] bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Head Coach · Black Belt
              </span>
            </div>

            <h2 className="mb-4 text-4xl font-black leading-tight text-foreground sm:text-5xl">
              SHAMSUDIN BAISAROV
            </h2>

            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-primary/80">
              Erster tschetschenischer BJJ-Schwarzgurt Österreichs
            </p>

            <div className="space-y-4 text-muted-foreground">
              <p>
                Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin
                das Training bei AXIS Jiu-Jitsu. Seine Philosophie: Technik, Disziplin
                und Respekt — auf und abseits der Matte.
              </p>
              <p>
                With years of international competitive experience, Shamsudin leads
                training at AXIS with a philosophy built on discipline, technique,
                and respect — on and off the mat.
              </p>
              <p>
                Ob Anfänger oder Wettkämpfer — unter seiner Anleitung findet jeder
                seinen Weg, stärker zu werden.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2">
              {['White','Blue','Purple','Brown','Black'].map(belt => (
                <div
                  key={belt}
                  title={belt + ' Belt'}
                  className="h-2 flex-1 rounded-sm"
                  style={{
                    background:
                      belt === 'White'  ? '#e5e7eb' :
                      belt === 'Blue'   ? '#1d4ed8' :
                      belt === 'Purple' ? '#7c3aed' :
                      belt === 'Brown'  ? '#78350f' :
                                          '#111111',
                    border: belt === 'Black' ? '1px solid oklch(58% 0.21 28)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 h-full w-3/4 bg-primary/5 blur-2xl" />
            <div className="relative overflow-hidden">
              <Image
                src="/images/Artboard-2-2-1170x536.png"
                alt="Shamsudin Baisarov — Head Coach AXIS Jiu-Jitsu Vienna"
                width={600}
                height={500}
                className="w-full object-cover object-top"
              />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
