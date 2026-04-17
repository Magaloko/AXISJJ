import { z } from 'zod'

export const LeadSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export type LeadFormData = z.infer<typeof LeadSchema>
