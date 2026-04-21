'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateMember } from '@/app/actions/members'
import { getCoachProfile, upsertCoachProfile } from '@/app/actions/coach-profile-admin'
import { useRouter } from 'next/navigation'
import { CoachNotesPanel } from './CoachNotesPanel'
import { MemberCompetitionsView } from './MemberCompetitionsView'
import { MemberProgressChart } from './MemberProgressChart'
import { MemberSkillsManager } from './MemberSkillsManager'
import { MemberSubscriptionPanel } from './MemberSubscriptionPanel'
import { translations, type Lang } from '@/lib/i18n'

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
  lang: Lang
}

export function MemberEditPanel({ member, viewerRole, onClose, lang }: Props) {
  const t = translations[lang].admin.memberEdit
  const [form, setForm] = useState({
    full_name: member.full_name,
    phone: member.phone ?? '',
    date_of_birth: member.date_of_birth ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [coachForm, setCoachForm] = useState({
    specialization: '',
    bio: '',
    achievements: '',
    showOnWebsite: false,
    displayOrder: 99,
  })
  const [coachSaveError, setCoachSaveError] = useState<string | null>(null)
  const [coachSaved, setCoachSaved] = useState(false)
  const [isCoachPending, startCoachTransition] = useTransition()
  const isCoach = member.role === 'coach' || member.role === 'owner'
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const readOnly = viewerRole !== 'owner'

  useEffect(() => {
    if (!isCoach || readOnly) return
    getCoachProfile(member.id).then(profile => {
      if (!profile) return
      setCoachForm({
        specialization: profile.specialization ?? '',
        bio: profile.bio ?? '',
        achievements: profile.achievements ?? '',
        showOnWebsite: profile.showOnWebsite,
        displayOrder: profile.displayOrder,
      })
    })
  }, [member.id, isCoach, readOnly])

  function saveCoachProfile() {
    setCoachSaveError(null)
    setCoachSaved(false)
    startCoachTransition(async () => {
      const result = await upsertCoachProfile(member.id, {
        specialization: coachForm.specialization || null,
        bio: coachForm.bio || null,
        achievements: coachForm.achievements || null,
        showOnWebsite: coachForm.showOnWebsite,
        displayOrder: coachForm.displayOrder,
      })
      if (result.error) { setCoachSaveError(result.error); return }
      setCoachSaved(true)
    })
  }

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
          <label className="mb-1 block text-xs text-muted-foreground">{t.name}</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.full_name} disabled={readOnly}
                 onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.phone}</label>
          <input className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.phone} disabled={readOnly}
                 onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.dateOfBirth}</label>
          <input type="date" className="w-full border border-border bg-background p-2 text-sm disabled:opacity-60"
                 value={form.date_of_birth} disabled={readOnly}
                 onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t.role}</label>
          <p className="text-sm font-bold capitalize">{member.role}</p>
          <p className="text-[10px] text-muted-foreground">{t.roleChangeHint}</p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={isPending}
                    className="flex-1 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {t.save}
            </button>
            <button onClick={onClose} className="border border-border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <MemberSubscriptionPanel profileId={member.id} />
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

      {isCoach && !readOnly && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.websiteProfile}
          </p>
          {coachSaveError && <p className="mb-3 text-xs text-destructive">{coachSaveError}</p>}
          {coachSaved && <p className="mb-3 text-xs text-primary">{t.saved}</p>}

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={coachForm.showOnWebsite}
                onChange={e => setCoachForm({ ...coachForm, showOnWebsite: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm">{t.showOnLandingPage}</span>
            </label>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.specialization}</label>
              <input
                className="w-full border border-border bg-background p-2 text-sm"
                placeholder={t.specializationPlaceholder}
                value={coachForm.specialization}
                onChange={e => setCoachForm({ ...coachForm, specialization: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.bio}</label>
              <textarea
                className="w-full border border-border bg-background p-2 text-sm resize-none"
                rows={3}
                value={coachForm.bio}
                onChange={e => setCoachForm({ ...coachForm, bio: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.achievements}</label>
              <textarea
                className="w-full border border-border bg-background p-2 text-sm resize-none"
                rows={2}
                placeholder={t.achievementsPlaceholder}
                value={coachForm.achievements}
                onChange={e => setCoachForm({ ...coachForm, achievements: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.displayOrder}</label>
              <input
                type="number"
                min={1}
                max={99}
                className="w-24 border border-border bg-background p-2 text-sm"
                value={coachForm.displayOrder}
                onChange={e => setCoachForm({ ...coachForm, displayOrder: Number(e.target.value) || 99 })}
              />
            </div>

            <button
              onClick={saveCoachProfile}
              disabled={isCoachPending}
              className="bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {isCoachPending ? t.saving : t.saveWebsiteProfile}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
