// components/members/ProfileForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { profileSchema, type ProfileFormData } from '@/app/actions/profile.schema'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  profile: { full_name: string; phone: string | null; date_of_birth: string | null; language: string } | null
  lang: Lang
}

export function ProfileForm({ profile, lang }: Props) {
  const t = translations[lang].konto
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null)
    const result = await updateProfile(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.fullName}
        </label>
        <input
          {...register('full_name')}
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.phone}
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-600">
          {t.dateOfBirth}
        </label>
        <input
          {...register('date_of_birth')}
          type="date"
          className="w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none [color-scheme:dark]"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-40"
        >
          {saved ? t.saved : t.save}
        </button>
        {serverError && <p className="text-xs text-red-500">{serverError}</p>}
      </div>
    </form>
  )
}
