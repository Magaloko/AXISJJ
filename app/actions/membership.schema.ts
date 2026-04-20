import { z } from 'zod'

export const membershipFormSchema = z.object({
  vorname:      z.string().min(2, 'Mindestens 2 Zeichen'),
  nachname:     z.string().min(2, 'Mindestens 2 Zeichen'),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  adresse:      z.string().min(5, 'Adresse ist Pflicht'),
  email:        z.string().email('Ungültige E-Mail'),
  telefon:      z.string().optional(),
  kategorie:    z.enum(['Erwachsene', 'Student', 'Kind']),
  laufzeit:     z.enum(['12', '6', '3', '1']),
  kontoinhaber: z.string().min(2, 'Kontoinhaber ist Pflicht'),
  iban:         z.string().min(15, 'Ungültige IBAN').max(34),
  bic:          z.string().optional(),
  nachricht:    z.string().max(500).optional(),
})

export type MembershipFormData = z.infer<typeof membershipFormSchema>
