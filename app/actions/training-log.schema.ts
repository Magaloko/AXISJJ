import { z } from 'zod'

export const trainingLogSchema = z.object({
  session_id:   z.string().uuid().optional().nullable(),
  mood_before:  z.number().int().min(1).max(5),
  mood_after:   z.number().int().min(1).max(5).optional(),
  energy:       z.number().int().min(1).max(5).optional(),
  technique:    z.number().int().min(1).max(5).optional(),
  conditioning: z.number().int().min(1).max(5).optional(),
  mental:       z.number().int().min(1).max(5).optional(),
  focus_areas:  z.array(z.string()).default([]),
  notes:        z.string().max(1000).optional(),
  next_goal:    z.string().max(500).optional(),
})

export type TrainingLogInput = z.infer<typeof trainingLogSchema>
