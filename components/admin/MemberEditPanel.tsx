'use client'

import { useState, useTransition } from 'react'
import { updateMember } from '@/app/actions/members'
import { useRouter } from 'next/navigation'
import { CoachNotesPanel } from './CoachNotesPanel'
import { MemberCompetitionsView } from './MemberCompetitionsView'
import { MemberProgressChart } from './MemberProgressChart'
import { MemberSkillsManager } from './MemberSkillsManager'

export interface MemberDetail {
  id: string
  full_name: string
  phone: string | null
  date_of_birth: string | null
  role: 'member' | 'coach' | 'owner'
}

interface Props {
  member: MemberDetail
  viewerRole: 'coach' | 'owner'
  onClose: () => void
}

export function MemberEditPanel({ member, viewerRole, onClose }: Props) {
  const [form, setForm] = useState({
    full_name: member.full_name,
    phone: member.phone ?? '',
    date_of_birth: member.date_of_birth ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const readOnly = viewerRole !== 'owner'

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateMember(member.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-card p-6 shadow-lg overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">{member.full_name}</h2>
        <button onClick={onClose} className="text-muted-foreground">✕</button>
      </div>
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.full_name} disabled={readOnly}
                 onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Telefon</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.phone} disabled={readOnly}
                 onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Geburtsdatum</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.date_of_birth} disabled={readOnly}
                 onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Rolle</label>
          <p className="text-sm font-bold capitalize">{member.role}</p>
          <p className="text-[10px] text-muted-foreground">Rolle ändern: /admin/einstellungen</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={isPending}
                    className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              Speichern
            </button>
            <button onClick={onClose} className="border border-border px-4 py-2 text-sm">Abbrechen</button>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <MemberProgressChart profileId={member.id} />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <MemberSkillsManager profileId={member.id} />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <MemberCompetitionsView profileId={member.id} />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <CoachNotesPanel profileId={member.id} />
      </div>
    </div>
  )
}
