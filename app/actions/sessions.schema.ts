import { z } from 'zod'

export const sessionFormSchema = z.object({
  id: z.string().uuid().optional(),
  class_type_id: z.string().uuid('Ungültiger Klassentyp'),
  coach_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Ungültiges Startdatum'),
  ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Ungültiges Enddatum'),
  capacity: z.number().int().min(1, 'Mindestens 1 Platz').max(200),
  location: z.string().min(1, 'Ort ist Pflicht').max(200),
})
