import Image from 'next/image'

interface Program {
  name: string
  nameEn: string
  description: string
  level: string
  image: string
  imageAlt: string
  accent: string
}

const PROGRAMS: Program[] = [
  {
    name: 'Fundamentals',
    nameEn: 'Fundamentals',
    description: 'Grundlagen und Techniken für Einsteiger und Weiße Gürtel. Der perfekte Einstieg ins BJJ.',
    level: 'Anfänger · White Belt',
    image: '/images/hero-action.jpg',
    imageAlt: 'Fundamentals BJJ Training',
    accent: 'border-t-border',
  },
  {
    name: 'All Levels Gi',
    nameEn: 'All Levels Gi',
    description: 'Gi-Training für alle Gürtelgrade. Technik, Sparring und Rollwork für jeden Level.',
    level: 'Alle Levels',
    image: '/images/hero-action.jpg',
    imageAlt: 'Gi BJJ Training Wien',
    accent: 'border-t-primary',
  },
  {
    name: 'No-Gi',
    nameEn: 'No-Gi Grappling',
    description: 'Grappling ohne Gi — schnell, athletisch und dynamisch. Für Blue Belt und höher.',
    level: 'Blue Belt+',
    image: '/images/nogi-training.jpg',
    imageAlt: 'No-Gi Grappling Training',
    accent: 'border-t-blue-600',
  },
  {
    name: 'Kids BJJ',
    nameEn: 'Kids BJJ',
    description: 'BJJ für Kinder von 6 bis 14 Jahren. Disziplin, Selbstvertrauen und Spaß auf der Matte.',
    level: '6–14 Jahre',
    image: '/images/kids-bjj.jpg',
    imageAlt: 'Kids BJJ Training Wien',
    accent: 'border-t-yellow-500',
  },
]

export function ProgramsGrid() {
  return (
    <section id="programme" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-12">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Programme · Classes
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            UNSERE KLASSEN
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROGRAMS.map(program => (
            <div
              key={program.name}
              className={`group relative overflow-hidden border-t-4 bg-card ${program.accent} transition-transform hover:-translate-y-1`}
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.imageAlt}
                  fill
                  className="object-cover object-center opacity-70 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              </div>

              <div className="p-6">
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {program.level}
                </span>
                <h3 className="mb-3 text-xl font-black text-foreground">
                  {program.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
