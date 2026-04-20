import { z } from 'zod'

export const tournamentInputSchema = z.object({
  name: z.string().min(1, 'Name ist Pflicht').max(200),
  date: z.string().min(1, 'Datum ist Pflicht'),
  end_date: z.string().optional().nullable(),
  location: z.string().min(1, 'Ort ist Pflicht').max(200),
  type: z.enum(['internal', 'external']),
  description: z.string().max(2000).optional().nullable(),
  registration_deadline: z.string().optional().nullable(),
})

export type TournamentInput = z.infer<typeof tournamentInputSchema>
