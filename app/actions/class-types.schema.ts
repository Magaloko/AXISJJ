import { z } from 'zod'

export const classTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name ist Pflicht').max(100),
  description: z.string().max(500).optional(),
  level: z.enum(['beginner', 'all', 'advanced', 'kids']),
  gi: z.boolean(),
  image_url: z.string().url().nullable().optional(),
})
