'use server'

import { createClient } from '@/lib/supabase/server'
import { assertStaff } from '@/lib/auth'

export interface Birthday {
  profileId: string
  fullName: string
  email: string
  dateOfBirth: string  // YYYY-MM-DD
  age: number
  daysUntil: number    // 0 = today, 1 = tomorrow, etc.
}

export async function getUpcomingBirthdays(windowDays = 14): Promise<Birthday[]> {
  const auth = await assertStaff()
  if ('error' in auth) return []

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, date_of_birth')
    .not('date_of_birth', 'is', null)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const birthdays: Birthday[] = []
  for (const p of profiles ?? []) {
    if (!p.date_of_birth) continue
    const [y, m, d] = p.date_of_birth.split('-').map(Number)
    if (!y || !m || !d) continue

    // Next occurrence of this birthday
    let nextBday = new Date(today.getFullYear(), m - 1, d)
    if (nextBday < today) nextBday = new Date(today.getFullYear() + 1, m - 1, d)
    const daysUntil = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil > windowDays) continue

    const age = nextBday.getFullYear() - y
    birthdays.push({
      profileId: p.id,
      fullName: p.full_name ?? 'Unbekannt',
      email: p.email,
      dateOfBirth: p.date_of_birth,
      age,
      daysUntil,
    })
  }

  birthdays.sort((a, b) => a.daysUntil - b.daysUntil)
  return birthdays
}
