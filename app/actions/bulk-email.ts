'use server'

import { z } from 'zod'
import nodemailer from 'nodemailer'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { assertOwner } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

const bulkEmailSchema = z.object({
  audience: z.enum(['members', 'coaches', 'all']),
  subject:  z.string().min(2, 'Betreff ist Pflicht').max(200),
  body:     z.string().min(10, 'Nachricht zu kurz').max(10_000),
})

export type BulkEmailInput = z.infer<typeof bulkEmailSchema>

function textToHtml(text: string, subject: string): string {
  const paragraphs = text.split(/\n\n+/).map(p =>
    `<p style="margin:0 0 1em;line-height:1.6">${p.replace(/\n/g, '<br/>').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  ).join('')
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#111;padding:20px 28px;margin-bottom:20px">
        <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
      </div>
      <div style="padding:0 28px">${paragraphs}</div>
      <div style="margin-top:24px;padding:14px 28px;background:#f5f5f5;font-size:11px;color:#999;text-align:center">
        Du erhältst diese E-Mail als Mitglied von Axis Jiu-Jitsu Vienna.
      </div>
    </div>
  `.trim()
}

export async function sendBulkEmail(
  data: BulkEmailInput,
): Promise<{ success?: true; sent?: number; failed?: number; error?: string }> {
  const parsed = bulkEmailSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return { error: 'E-Mail-Versand nicht konfiguriert.' }

  const admin = createServiceRoleClient()
  let query = admin.from('profiles').select('email, full_name')
  if (parsed.data.audience === 'members') query = query.eq('role', 'member')
  if (parsed.data.audience === 'coaches') query = query.eq('role', 'coach')

  const { data: recipients, error: queryError } = await query
  if (queryError) {
    console.error('[bulk-email] query error:', queryError)
    return { error: `Abfrage fehlgeschlagen: ${queryError.message}` }
  }
  const list = (recipients ?? []).filter(r => r.email)
  if (list.length === 0) return { error: 'Keine Empfänger gefunden.' }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: gmailUser, pass: gmailPass },
  })

  const html = textToHtml(parsed.data.body, parsed.data.subject)
  let sent = 0
  let failed = 0

  for (const r of list) {
    try {
      await transporter.sendMail({
        from: gmailUser,
        to: r.email,
        subject: parsed.data.subject,
        text: parsed.data.body,
        html,
      })
      sent++
    } catch (err) {
      console.error('[bulk-email] send failed for', r.email, err)
      failed++
    }
  }

  await logAudit({
    action: 'bulk_email.sent',
    targetType: 'audience',
    targetId: parsed.data.audience,
    targetName: parsed.data.subject,
    meta: { audience: parsed.data.audience, sent, failed, total: list.length },
  })

  return { success: true, sent, failed }
}
