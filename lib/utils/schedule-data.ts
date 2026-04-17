// Static schedule — replaced by live DB query in Phase 4

export interface ScheduleClass {
  name: string
  time: string
  endTime: string
  level: 'beginner' | 'all' | 'advanced' | 'kids'
  gi: boolean
}

export interface ScheduleDay {
  label: string
  short: string
  classes: ScheduleClass[]
}

export const SCHEDULE: ScheduleDay[] = [
  {
    label: 'Montag', short: 'MO',
    classes: [
      { name: 'Fundamentals',     time: '10:00', endTime: '11:00', level: 'beginner', gi: true },
      { name: 'All Levels Gi',    time: '18:00', endTime: '19:30', level: 'all',      gi: true },
      { name: 'No-Gi All Levels', time: '19:30', endTime: '21:00', level: 'all',      gi: false },
    ],
  },
  {
    label: 'Dienstag', short: 'DI',
    classes: [
      { name: 'Fundamentals', time: '18:00', endTime: '19:00', level: 'beginner', gi: true },
      { name: 'Advanced Gi',  time: '19:00', endTime: '20:30', level: 'advanced', gi: true },
    ],
  },
  {
    label: 'Mittwoch', short: 'MI',
    classes: [
      { name: 'Kids BJJ',       time: '16:00', endTime: '17:00', level: 'kids',     gi: true },
      { name: 'All Levels Gi',  time: '18:00', endTime: '19:30', level: 'all',      gi: true },
      { name: 'No-Gi Advanced', time: '19:30', endTime: '21:00', level: 'advanced', gi: false },
    ],
  },
  {
    label: 'Donnerstag', short: 'DO',
    classes: [
      { name: 'Fundamentals',  time: '18:00', endTime: '19:00', level: 'beginner', gi: true },
      { name: 'All Levels Gi', time: '19:00', endTime: '20:30', level: 'all',      gi: true },
    ],
  },
  {
    label: 'Freitag', short: 'FR',
    classes: [
      { name: 'No-Gi All Levels', time: '18:00', endTime: '19:30', level: 'all', gi: false },
      { name: 'Open Mat',         time: '19:30', endTime: '21:00', level: 'all', gi: true  },
    ],
  },
  {
    label: 'Samstag', short: 'SA',
    classes: [
      { name: 'Kids BJJ',      time: '10:00', endTime: '11:00', level: 'kids', gi: true },
      { name: 'All Levels Gi', time: '11:00', endTime: '12:30', level: 'all',  gi: true },
      { name: 'Open Mat',      time: '12:30', endTime: '14:00', level: 'all',  gi: true },
    ],
  },
  {
    label: 'Sonntag', short: 'SO',
    classes: [
      { name: 'Strength & Conditioning', time: '10:00', endTime: '11:00', level: 'all', gi: false },
    ],
  },
]
