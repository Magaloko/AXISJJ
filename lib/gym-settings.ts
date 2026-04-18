import { createClient } from '@/lib/supabase/server'

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface OpeningHoursDay {
  open: string | null
  close: string | null
  closed: boolean
}

export type OpeningHours = Record<DayKey, OpeningHoursDay>

export interface GymSettings {
  name: string
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: OpeningHours
  house_rules: string | null
  cancellation_policy: string | null
  pricing_info: string | null
  updated_at: string
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

const FALLBACK: GymSettings = {
  name: 'AXIS Jiu-Jitsu',
  address_line1: null, address_line2: null,
  postal_code: null, city: null, country: 'Österreich',
  phone: null, email: null, website: null,
  opening_hours: DEFAULT_OPENING_HOURS,
  house_rules: null, cancellation_policy: null, pricing_info: null,
  updated_at: new Date().toISOString(),
}

export async function getGymSettings(): Promise<GymSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gym_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return FALLBACK
  return data as unknown as GymSettings
}
