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

const LEVEL_COLORS: Record<ScheduleClass['level'], string> = {
  beginner: 'border-l-white/40',
  all:      'border-l-red-600',
  advanced: 'border-l-blue-500',
  kids:     'border-l-yellow-500',
}

export function ScheduleWidget() {
  const [activeDay, setActiveDay] = useState(0)
  const day = SCHEDULE[activeDay]

  return (
    <section id="trainingsplan" className="bg-[#0f0f0f] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-red-600">
            Schedule · Trainingsplan
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            WÖCHENTLICHER STUNDENPLAN
          </h2>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto pb-1">
          {SCHEDULE.map((d, i) => (
            <button
              key={d.short}
              onClick={() => setActiveDay(i)}
              className={cn(
                'min-w-[52px] flex-shrink-0 px-3 py-2 text-xs font-bold tracking-wider transition-all',
                activeDay === i
                  ? 'bg-red-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-500 hover:bg-[#222] hover:text-gray-300'
              )}
            >
              {d.short}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
          {day.label}
        </p>

        {day.classes.length === 0 ? (
          <p className="text-gray-600">Kein Training an diesem Tag.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {day.classes.map(cls => (
              <div
                key={`${cls.name}-${cls.time}`}
                className={cn(
                  'flex items-center justify-between border-l-4 bg-[#1a1a1a] px-4 py-4 transition-colors hover:bg-[#222]',
                  LEVEL_COLORS[cls.level]
                )}
              >
                <div>
                  <p className="font-semibold text-white">{cls.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{LEVEL_LABELS[cls.level]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[#111] px-2 py-1 text-xs font-bold text-gray-400">
                    {cls.gi ? 'GI' : 'NO-GI'}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{cls.time}</p>
                    <p className="text-xs text-gray-600">{cls.endTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-700">
          * Stundenplan kann variieren. Änderungen auf @axisjj_at.
        </p>
      </div>
    </section>
  )
}
