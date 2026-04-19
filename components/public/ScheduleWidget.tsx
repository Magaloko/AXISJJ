'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { SCHEDULE, type ScheduleClass } from '@/lib/utils/schedule-data'

const LEVEL_LABELS: Record<ScheduleClass['level'], string> = {
  beginner: 'Anfänger',
  all:      'Alle Levels',
  advanced: 'Blue Belt+',
  kids:     'Kids',
}

const LEVEL_BAR: Record<ScheduleClass['level'], string> = {
  beginner: 'bg-border',
  all:      'bg-primary',
  advanced: 'bg-blue-500',
  kids:     'bg-yellow-400',
}

const LEVEL_TEXT: Record<ScheduleClass['level'], string> = {
  beginner: 'text-muted-foreground',
  all:      'text-primary',
  advanced: 'text-blue-400',
  kids:     'text-yellow-400',
}

function ClassCard({ cls }: { cls: ScheduleClass }) {
  return (
    <div className="relative overflow-hidden border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted">
      {/* level color bar */}
      <div className={cn('absolute left-0 top-0 h-full w-1', LEVEL_BAR[cls.level])} />
      <div className="pl-3">
        {/* name + gi badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black leading-tight text-foreground">{cls.name}</p>
          <span className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider',
            cls.gi
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground border border-border'
          )}>
            {cls.gi ? 'GI' : 'NO-GI'}
          </span>
        </div>

        {/* time */}
        <p className="mt-1 font-mono text-xs font-bold text-foreground">
          {cls.time} – {cls.endTime}
        </p>

        {/* level */}
        <p className={cn('mt-0.5 text-[10px] font-semibold uppercase tracking-wider', LEVEL_TEXT[cls.level])}>
          {LEVEL_LABELS[cls.level]}
        </p>

        {/* trainer */}
        <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
          👤 {cls.trainer}
        </p>
      </div>
    </div>
  )
}

export function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(0)

  return (
    <section id="trainingsplan" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Schedule · Trainingsplan
          </p>
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">
            WÖCHENTLICHER STUNDENPLAN
          </h2>
        </div>

        {/* ── DESKTOP: full week grid ── */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-3">
            {SCHEDULE.map(day => (
              <div key={day.short}>
                {/* Day header */}
                <div className="mb-3 border-b-2 border-primary pb-2 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
                    {day.short}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{day.label}</p>
                </div>

                {/* Classes */}
                {day.classes.length === 0 ? (
                  <div className="flex h-20 items-center justify-center text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                    Kein Training
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {day.classes.map(cls => (
                      <ClassCard key={`${cls.name}-${cls.time}`} cls={cls} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── MOBILE: tab per day ── */}
        <div className="md:hidden">
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            {SCHEDULE.map((d, i) => (
              <button
                key={d.short}
                onClick={() => setActiveDay(i)}
                className={cn(
                  'min-w-[44px] shrink-0 px-3 py-2 text-xs font-black uppercase tracking-wider transition-all',
                  activeDay === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                {d.short}
              </button>
            ))}
          </div>

          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground">
            {SCHEDULE[activeDay].label}
          </p>

          {SCHEDULE[activeDay].classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kein Training an diesem Tag.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {SCHEDULE[activeDay].classes.map(cls => (
                <ClassCard key={`${cls.name}-${cls.time}`} cls={cls} />
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4">
          {(Object.keys(LEVEL_LABELS) as ScheduleClass['level'][]).map(level => (
            <div key={level} className="flex items-center gap-2">
              <div className={cn('h-3 w-1 rounded-full', LEVEL_BAR[level])} />
              <span className="text-xs text-muted-foreground">{LEVEL_LABELS[level]}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          * Stundenplan kann variieren. Aktuelle Änderungen auf @axisjj_at.
        </p>
      </div>
    </section>
  )
}
