import { z } from 'zod'

const PHONE_REGEX = /^[\d\s+\-().]{3,20}$/
const NAME_REGEX = /^[\p{L}\s\-'.]+$/u

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Mindestens 2 Zeichen')
    .max(100, 'Höchstens 100 Zeichen')
    .regex(NAME_REGEX, 'Nur Buchstaben, Leerzeichen, -, \', .'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || PHONE_REGEX.test(v), 'Ungültige Telefonnummer'),
  date_of_birth: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d < today
    }, 'Datum muss in der Vergangenheit liegen'),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Aktuelles Passwort fehlt'),
    new_password: z
      .string()
      .min(8, 'Mindestens 8 Zeichen')
      .max(128, 'Höchstens 128 Zeichen'),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirm_password'],
  })

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>
