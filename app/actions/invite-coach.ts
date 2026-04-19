'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { assertOwner } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'

const inviteCoachSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail'),
})

export type InviteCoachInput = z.infer<typeof inviteCoachSchema>

function generatePassword(): string {
  // 16 chars, A-Z a-z 0-9 + some symbols
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let pw = ''
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  for (const b of bytes) pw += chars[b % chars.length]
  return pw
}

async function sendCredentialsEmail(name: string, email: string, password: string): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    console.error('[invite-coach] GMAIL credentials missing')
    return false
  }
  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : 'https://axisjj.vercel.app/login'

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#111;padding:24px 32px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">Dein Coach-Zugang</p>
      </div>
      <div style="padding:0 32px">
        <p style="font-size:15px">Hallo <strong>${name}</strong>,</p>
        <p style="font-size:14px;line-height:1.6">
          dein AXIS-Coach-Account wurde soeben angelegt. Mit den folgenden Zugangsdaten
          kannst du dich im Admin-Bereich einloggen:
        </p>
        <div style="background:#f5f5f5;border-left:3px solid #e63946;padding:16px 20px;margin:20px 0;font-family:monospace;font-size:14px">
          <p style="margin:0 0 8px"><strong>E-Mail:</strong> ${email}</p>
          <p style="margin:0"><strong>Passwort:</strong> ${password}</p>
        </div>
        <p style="font-size:14px;line-height:1.6">
          <strong>Wichtig:</strong> Bitte ändere dein Passwort nach dem ersten Login im Konto-Bereich.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#e63946;color:#fff;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:2px;text-transform:uppercase">
            Jetzt einloggen
          </a>
        </div>
        <p style="font-size:12px;color:#999;margin-top:32px;padding-top:16px;border-top:1px solid #ddd">
          Falls du diese E-Mail nicht erwartet hast, ignoriere sie einfach.
        </p>
      </div>
      <div style="padding:16px 32px;background:#f5f5f5;font-size:11px;color:#999;text-align:center">
        Axis Jiu-Jitsu Vienna · Strindberggasse 1/R01, 1110 Wien
      </div>
    </div>`

  const text = [
    `Hallo ${name},`,
    '',
    'dein AXIS-Coach-Account wurde angelegt.',
    '',
    `E-Mail:   ${email}`,
    `Passwort: ${password}`,
    '',
    `Login:    ${loginUrl}`,
    '',
    'Bitte ändere das Passwort nach dem ersten Login.',
    '',
    'Axis Jiu-Jitsu Vienna',
  ].join('\n')

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    })
    await transporter.sendMail({
      from: gmailUser,
      to: email,
      subject: 'Dein AXIS Coach-Zugang',
      text, html,
    })
    return true
  } catch (err) {
    console.error('[invite-coach] email error:', err)
    return false
  }
}

export async function inviteCoach(
  data: InviteCoachInput,
): Promise<{ success?: true; error?: string; message?: string }> {
  const parsed = inviteCoachSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }

  const auth = await assertOwner()
  if ('error' in auth) return { error: auth.error }

  const admin = createServiceRoleClient()
  const password = generatePassword()

  // Try creating a fresh user. If email is already registered, fall back to updating existing profile to coach.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      // Already exists — promote existing profile to coach
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('email', parsed.data.email)
        .single()
      if (!existing) return { error: 'E-Mail existiert in Auth, aber kein Profil gefunden.' }

      const { error: updateError } = await admin
        .from('profiles')
        .update({ role: 'coach', full_name: parsed.data.full_name })
        .eq('id', existing.id)
      if (updateError) return { error: `Profil-Update fehlgeschlagen: ${updateError.message}` }

      revalidatePath('/admin/einstellungen')
      revalidatePath('/admin/mitglieder')
      return { success: true, message: 'Bestehendes Profil wurde zu Coach aktualisiert (kein neues Passwort gesendet).' }
    }
    console.error('[invite-coach] create error:', createError)
    return { error: `Coach-Erstellung fehlgeschlagen: ${createError.message}` }
  }

  if (!created.user) return { error: 'User wurde nicht erstellt.' }

  // Create or update profile with coach role
  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: 'coach',
    language: 'de',
  })
  if (profileError) {
    console.error('[invite-coach] profile error:', profileError)
    // Rollback auth user
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    return { error: `Profil-Erstellung fehlgeschlagen: ${profileError.message}` }
  }

  // Send credentials email
  const emailSent = await sendCredentialsEmail(parsed.data.full_name, parsed.data.email, password)

  revalidatePath('/admin/einstellungen')
  revalidatePath('/admin/mitglieder')

  if (!emailSent) {
    // Fallback: return password so owner can share it manually
    return {
      success: true,
      message: `Coach angelegt, aber E-Mail-Versand fehlgeschlagen. Gib das Passwort manuell weiter: ${password}`,
    }
  }

  return { success: true, message: `Einladung an ${parsed.data.email} gesendet — Login-Daten per E-Mail.` }
}
