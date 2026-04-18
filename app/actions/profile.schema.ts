import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
