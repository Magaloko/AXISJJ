'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { changePassword } from '@/app/actions/profile'
import {
  passwordChangeSchema,
  type PasswordChangeData,
} from '@/app/actions/profile.schema'
import { translations, type Lang } from '@/lib/i18n'

interface Props {
  lang: Lang
}

export function PasswordChangeCard({ lang }: Props) {
  const t = translations[lang].konto
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(timer)
  }, [saved])

  const onSubmit = async (data: PasswordChangeData) => {
    setServerError(null)
    const result = await changePassword(data)
    if (result.error) {
      setServerError(result.error)
    } else {
      setSaved(true)
      reset({ current_password: '', new_password: '', confirm_password: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="current_password"
          className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t.currentPassword}
        </label>
        <input
          id="current_password"
          type="password"
          autoComplete="current-password"
          aria-describedby={errors.current_password ? 'current_password_error' : undefined}
          {...register('current_password')}
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {errors.current_password && (
          <p id="current_password_error" className="mt-1 text-xs text-destructive">
            {errors.current_password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="new_password"
          className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t.newPassword}
        </label>
        <input
          id="new_password"
          type="password"
          autoComplete="new-password"
          aria-describedby={errors.new_password ? 'new_password_error' : 'new_password_hint'}
          {...register('new_password')}
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {errors.new_password ? (
          <p id="new_password_error" className="mt-1 text-xs text-destructive">
            {errors.new_password.message}
          </p>
        ) : (
          <p id="new_password_hint" className="mt-1 text-xs text-muted-foreground">
            {t.passwordHint}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t.confirmPassword}
        </label>
        <input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          aria-describedby={errors.confirm_password ? 'confirm_password_error' : undefined}
          {...register('confirm_password')}
          className="w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        {errors.confirm_password && (
          <p id="confirm_password_error" className="mt-1 text-xs text-destructive">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {saved ? t.passwordChanged : t.changePasswordBtn}
        </button>
        {serverError && <p className="text-xs text-destructive">{serverError}</p>}
      </div>
    </form>
  )
}
