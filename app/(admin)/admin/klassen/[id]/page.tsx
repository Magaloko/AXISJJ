// app/(admin)/admin/klassen/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getSessionRatings } from '@/app/actions/session-ratings'
import { getSessionPairings } from '@/app/actions/sparring'
import { SessionDetailClient } from '@/components/admin/session/SessionDetailClient'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Session-Detail | Admin' }

interface Props { params: Promise<{ id: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['coach', 'owner', 'developer'].includes(profile.role)) redirect('/admin/dashboard')

  // Fetch session details
  const { data: session } = await supabase
    .from('class_sessions')
    .select(`
      id, starts_at, ends_at, cancelled, location, capacity, coach_id,
      class_types(name, gi, level),
      profiles!class_sessions_coach_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!session) notFound()

  // Fetch attendances for this session with profile info
  const { data: attendances } = await supabase
    .from('attendances')
    .select('id, profile_id, checked_in_at')
    .eq('session_id', id)
    .order('checked_in_at', { ascending: true })

  const attendeeIds = (attendances ?? []).map((a: any) => a.profile_id)
  let attendeeProfiles: { id: string; full_name: string | null }[] = []
  if (attendeeIds.length) {
    const { data } = await supabase
      .from('profiles').select('id, full_name').in('id', attendeeIds)
    attendeeProfiles = data ?? []
  }

  const nameMap = new Map(attendeeProfiles.map((p: any) => [p.id, p.full_name]))
  const attendeeList = (attendances ?? []).map((a: any) => ({
    id: a.id,
    profile_id: a.profile_id,
    full_name: nameMap.get(a.profile_id) ?? null,
    checked_in_at: a.checked_in_at,
  }))

  // Fetch all members (for sparring pairing selector)
  const { data: allMembers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  // Ratings + pairings in parallel
  const [ratings, pairings] = await Promise.all([
    getSessionRatings(id),
    getSessionPairings(id),
  ])

  const classType = Array.isArray(session.class_types)
    ? session.class_types[0]
    : session.class_types
  const coachProfile = Array.isArray(session.profiles)
    ? session.profiles[0]
    : session.profiles

  const sessionData = {
    id: session.id,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    cancelled: session.cancelled,
    location: session.location,
    capacity: session.capacity,
    coach_id: session.coach_id ?? null,
    coach_name: (coachProfile as any)?.full_name ?? null,
    class_type_name: (classType as any)?.name ?? null,
    class_type_gi: (classType as any)?.gi ?? false,
    class_type_level: (classType as any)?.level ?? null,
    is_sparring: (session as any).is_sparring ?? false,
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Session</p>
        <h1 className="text-2xl font-black text-foreground">
          {sessionData.class_type_name ?? 'Training'} &mdash;{' '}
          {format(new Date(sessionData.starts_at), 'EEEE, dd. MMMM yyyy', { locale: de })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(sessionData.starts_at), 'HH:mm')}
          {' – '}
          {format(new Date(sessionData.ends_at), 'HH:mm')}
          {sessionData.location ? ` · ${sessionData.location}` : ''}
          {sessionData.coach_name ? ` · ${sessionData.coach_name}` : ''}
        </p>
      </div>

      <SessionDetailClient
        session={sessionData}
        attendees={attendeeList}
        allMembers={(allMembers ?? []).map((m: any) => ({ id: m.id, full_name: m.full_name }))}
        ratings={ratings}
        pairings={pairings}
      />
    </div>
  )
}
