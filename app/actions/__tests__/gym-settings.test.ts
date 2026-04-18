import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = { from: vi.fn(), auth: { getUser: vi.fn() } }
vi.mock('@/lib/supabase/server', () => ({ createClient: () => Promise.resolve(mockSupabase) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notify: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => p }))

import { updateGymInfo, updateOpeningHours, updatePolicies } from '../gym-settings'
import type { OpeningHours } from '@/lib/gym-settings'

function callerChain(role: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  }
}

const validHours: OpeningHours = {
  mon: { open: '16:00', close: '22:00', closed: false },
  tue: { open: '16:00', close: '22:00', closed: false },
  wed: { open: '16:00', close: '22:00', closed: false },
  thu: { open: '16:00', close: '22:00', closed: false },
  fri: { open: '16:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

describe('updateGymInfo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateGymInfo({ name: 'X' })).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateGymInfo({ name: 'AXIS', city: 'Wien' })
    expect(res.success).toBe(true)
  })
})

describe('updateOpeningHours', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updateOpeningHours(validHours)).error).toBeTruthy()
  })
  it('rejects invalid shape (missing day)', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad = { ...validHours } as any
    delete bad.mon
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('rejects open day with missing times', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad: OpeningHours = { ...validHours, mon: { open: null, close: null, closed: false } }
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('rejects invalid time format', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const bad: OpeningHours = { ...validHours, mon: { open: '25:99', close: '22:00', closed: false } }
    expect((await updateOpeningHours(bad)).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updateOpeningHours(validHours)
    expect(res.success).toBe(true)
  })
})

describe('updatePolicies', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null })
  })
  it('rejects non-owner', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('coach'))
    expect((await updatePolicies({ house_rules: 'x' })).error).toBeTruthy()
  })
  it('updates on success', async () => {
    mockSupabase.from.mockReturnValueOnce(callerChain('owner'))
    const upd = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    mockSupabase.from.mockReturnValueOnce(upd)
    const res = await updatePolicies({ house_rules: 'Be respectful.', pricing_info: '€99/mo' })
    expect(res.success).toBe(true)
  })
})
