'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertStaff, assertOwner } from '@/lib/auth'

export interface TrainingGroup {
  id: string
  name: string
  description: string | null
  coach_id: string | null
  color: string
  created_at: string
  coach_name?: string | null
  member_count?: number
}

export interface GroupMember {
  profile_id: string
  full_name: string | null
  email: string | null
  joined_at: string
  attendance_count: number
  group_attendance_count: number // sessions in this group the member attended
}

export interface GroupStats {
  group: TrainingGroup
  members: GroupMember[]
  totalSessions: number        // total sessions since group created
  avgAttendanceRate: number    // avg % of group sessions attended across members
  topAttendee: GroupMember | null
  sessionFillRates: { session_id: string; starts_at: string; label: string; booked: number; capacity: number }[]
}

// ── List all groups ──────────────────────────────────────────

export async function getTrainingGroups(): Promise<TrainingGroup[]> {
  const check = await assertStaff()
  if ('error' in check) return []

  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('training_groups' as any)
    .select('id, name, description, coach_id, color, created_at')
    .order('name', { ascending: true })

  if (!groups?.length) return []

  const coachIds = [...new Set((groups as any[]).map((g: any) => g.coach_id).filter(Boolean))]
  let coachMap = new Map<string, string>()
  if (coachIds.length) {
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', coachIds as string[])
    for (const c of coaches ?? []) coachMap.set(c.id, c.full_name ?? '')
  }

  const groupIds = (groups as any[]).map((g: any) => g.id)
  const { data: counts } = await supabase
    .from('training_group_members' as any)
    .select('group_id')
    .in('group_id', groupIds)

  const countMap = new Map<string, number>()
  for (const row of (counts ?? []) as any[]) {
    countMap.set(row.group_id, (countMap.get(row.group_id) ?? 0) + 1)
  }

  return (groups as any[]).map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    coach_id: g.coach_id,
    color: g.color,
    created_at: g.created_at,
    coach_name: g.coach_id ? (coachMap.get(g.coach_id) ?? null) : null,
    member_count: countMap.get(g.id) ?? 0,
  }))
}

// ── Get single group with stats ──────────────────────────────

export async function getGroupStats(groupId: string): Promise<GroupStats | null> {
  const check = await assertStaff()
  if ('error' in check) return null

  const supabase = await createClient()

  const { data: group } = await (supabase as any)
    .from('training_groups')
    .select('id, name, description, coach_id, color, created_at')
    .eq('id', groupId)
    .single()
  if (!group) return null

  // Members of this group
  const { data: memberRows } = await (supabase as any)
    .from('training_group_members')
    .select('profile_id, joined_at')
    .eq('group_id', groupId)

  const memberIds: string[] = (memberRows ?? []).map((r: any) => r.profile_id)

  // Profile info for members
  let profileMap = new Map<string, { full_name: string | null; email: string | null }>()
  if (memberIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', memberIds)
    for (const p of profiles ?? []) profileMap.set(p.id, { full_name: p.full_name, email: p.email ?? null })
  }

  // Total attendances per member
  let attMap = new Map<string, number>()
  if (memberIds.length) {
    const { data: atts } = await supabase
      .from('attendances')
      .select('profile_id')
      .in('profile_id', memberIds)
    for (const a of atts ?? []) {
      attMap.set(a.profile_id, (attMap.get(a.profile_id) ?? 0) + 1)
    }
  }

  // Sessions where coach_id matches group's coach (sessions "belonging to" this group)
  // A group's sessions = all sessions since group was created where coach = group.coach_id
  let groupSessionIds: string[] = []
  let totalSessions = 0
  if (group.coach_id) {
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('coach_id', group.coach_id)
      .eq('cancelled', false)
      .gte('starts_at', group.created_at)
    groupSessionIds = (sessions ?? []).map((s: any) => s.id)
    totalSessions = groupSessionIds.length
  }

  // Group-session attendance per member
  let groupAttMap = new Map<string, number>()
  if (groupSessionIds.length && memberIds.length) {
    const { data: grpAtts } = await supabase
      .from('attendances')
      .select('profile_id, session_id')
      .in('profile_id', memberIds)
      .in('session_id', groupSessionIds)
    for (const a of grpAtts ?? []) {
      groupAttMap.set(a.profile_id, (groupAttMap.get(a.profile_id) ?? 0) + 1)
    }
  }

  const members: GroupMember[] = (memberRows ?? []).map((r: any) => {
    const profile = profileMap.get(r.profile_id)
    return {
      profile_id: r.profile_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      joined_at: r.joined_at,
      attendance_count: attMap.get(r.profile_id) ?? 0,
      group_attendance_count: groupAttMap.get(r.profile_id) ?? 0,
    }
  }).sort((a: GroupMember, b: GroupMember) => b.group_attendance_count - a.group_attendance_count)

  const avgAttendanceRate = totalSessions > 0 && members.length > 0
    ? Math.round(
        members.reduce((sum, m) => sum + (m.group_attendance_count / totalSessions) * 100, 0) / members.length
      )
    : 0

  // Fill rates for last 20 sessions of this group's coach
  let sessionFillRates: GroupStats['sessionFillRates'] = []
  if (group.coach_id) {
    const { data: recentSessions } = await supabase
      .from('class_sessions')
      .select('id, starts_at, capacity')
      .eq('coach_id', group.coach_id)
      .eq('cancelled', false)
      .order('starts_at', { ascending: false })
      .limit(20)

    if (recentSessions?.length) {
      const sIds = recentSessions.map((s: any) => s.id)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('session_id')
        .in('session_id', sIds)
        .eq('status', 'confirmed')

      const bookedMap = new Map<string, number>()
      for (const b of bookings ?? []) {
        bookedMap.set(b.session_id, (bookedMap.get(b.session_id) ?? 0) + 1)
      }

      sessionFillRates = recentSessions.map((s: any) => ({
        session_id: s.id,
        starts_at: s.starts_at,
        label: new Date(s.starts_at).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        booked: bookedMap.get(s.id) ?? 0,
        capacity: s.capacity ?? 0,
      })).reverse()
    }
  }

  return {
    group: {
      ...group,
      coach_name: null,
    },
    members,
    totalSessions,
    avgAttendanceRate,
    topAttendee: members[0] ?? null,
    sessionFillRates,
  }
}

// ── Create group ─────────────────────────────────────────────

export async function createTrainingGroup(data: {
  name: string
  description?: string
  coach_id?: string
  color?: string
}): Promise<{ id?: string; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { data: row, error } = await (supabase as any)
    .from('training_groups')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      coach_id: data.coach_id || null,
      color: data.color || '#dc2626',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/gruppen')
  return { id: row.id }
}

// ── Update group ─────────────────────────────────────────────

export async function updateTrainingGroup(
  groupId: string,
  data: { name?: string; description?: string | null; coach_id?: string | null; color?: string }
): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('training_groups')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) return { error: error.message }
  revalidatePath('/admin/gruppen')
  revalidatePath(`/admin/gruppen/${groupId}`)
  return { success: true }
}

// ── Delete group ─────────────────────────────────────────────

export async function deleteTrainingGroup(groupId: string): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any).from('training_groups').delete().eq('id', groupId)
  if (error) return { error: error.message }
  revalidatePath('/admin/gruppen')
  return { success: true }
}

// ── Add / remove group member ────────────────────────────────

export async function addGroupMember(groupId: string, profileId: string): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('training_group_members')
    .upsert({ group_id: groupId, profile_id: profileId })
  if (error) return { error: error.message }
  revalidatePath(`/admin/gruppen/${groupId}`)
  return { success: true }
}

export async function removeGroupMember(groupId: string, profileId: string): Promise<{ success?: true; error?: string }> {
  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('training_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', profileId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/gruppen/${groupId}`)
  return { success: true }
}

// ── Fill-rate stats per coach ────────────────────────────────

export interface CoachFillStats {
  coach_id: string
  coach_name: string
  total_sessions: number
  avg_fill_pct: number
  fully_booked: number
}

export async function getCoachFillStats(): Promise<CoachFillStats[]> {
  const check = await assertStaff()
  if ('error' in check) return []

  const supabase = await createClient()

  // Last 90 days
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('id, coach_id, capacity')
    .eq('cancelled', false)
    .gte('starts_at', since)
    .not('coach_id', 'is', null)

  if (!sessions?.length) return []

  const sessionIds = sessions.map((s: any) => s.id)
  const coachIds = [...new Set(sessions.map((s: any) => s.coach_id as string))]

  const [bookingsRes, profilesRes] = await Promise.all([
    supabase.from('bookings').select('session_id').in('session_id', sessionIds).eq('status', 'confirmed'),
    supabase.from('profiles').select('id, full_name').in('id', coachIds),
  ])

  const bookedMap = new Map<string, number>()
  for (const b of bookingsRes.data ?? []) {
    bookedMap.set(b.session_id, (bookedMap.get(b.session_id) ?? 0) + 1)
  }

  const nameMap = new Map<string, string>()
  for (const p of profilesRes.data ?? []) nameMap.set(p.id, p.full_name ?? p.id)

  const coachData = new Map<string, { total: number; fillSum: number; full: number }>()
  for (const s of sessions as any[]) {
    const booked = bookedMap.get(s.id) ?? 0
    const cap = s.capacity ?? 0
    const pct = cap > 0 ? booked / cap : 0
    const existing = coachData.get(s.coach_id) ?? { total: 0, fillSum: 0, full: 0 }
    coachData.set(s.coach_id, {
      total: existing.total + 1,
      fillSum: existing.fillSum + pct,
      full: existing.full + (pct >= 0.95 ? 1 : 0),
    })
  }

  return [...coachData.entries()]
    .map(([coach_id, d]) => ({
      coach_id,
      coach_name: nameMap.get(coach_id) ?? coach_id,
      total_sessions: d.total,
      avg_fill_pct: Math.round((d.fillSum / d.total) * 100),
      fully_booked: d.full,
    }))
    .sort((a, b) => b.total_sessions - a.total_sessions)
}
