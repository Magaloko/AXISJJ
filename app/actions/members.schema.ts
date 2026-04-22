import { z } from 'zod'

export const memberUpdateSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen').max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum (YYYY-MM-DD)').optional().nullable(),
})

export const memberRoleSchema = z.enum(['member', 'coach', 'owner', 'developer'])
