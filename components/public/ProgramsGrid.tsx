import { ClassesGrid } from '@/components/ui/classes-grid'
import { translations, type Lang } from '@/lib/i18n'

interface ProgramsGridProps {
  lang: Lang
}

export function ProgramsGrid({ lang }: ProgramsGridProps) {
  const t = translations[lang].public.programs
  return (
    <section id="programme" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.eyebrow}
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            {t.heading}
          </h2>
        </div>
        <ClassesGrid />
      </div>
    </section>
  )
}