'use server'

import nodemailer from 'nodemailer'
import { membershipFormSchema, type MembershipFormData } from './membership.schema'

const RECIPIENT = 'magomed.dadakaev@gmail.com'

export async function submitMembership(
  data: MembershipFormData,
): Promise<{ success?: true; error?: string }> {
  const parsed = membershipFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }

  const d = parsed.data
  const laufzeitLabel: Record<string, string> = {
    '12': '12 Monate', '6': '6 Monate', '3': '3 Monate', '1': '1 Monat',
  }

  const subject = `Mitgliedsantrag: ${d.vorname} ${d.nachname}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#111;padding:24px 32px;margin-bottom:32px">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
        <p style="color:#888;margin:4px 0 0;font-size:13px">Neuer Mitgliedsantrag</p>
      </div>

      <div style="padding:0 32px">
        <h2 style="font-size:16px;border-bottom:2px solid #e63946;padding-bottom:8px;margin-bottom:16px">
          Persönliche Daten
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:40%">Vorname</td><td style="padding:6px 0;font-weight:600">${d.vorname}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Nachname</td><td style="padding:6px 0;font-weight:600">${d.nachname}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Geburtsdatum</td><td style="padding:6px 0;font-weight:600">${d.geburtsdatum}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Adresse</td><td style="padding:6px 0;font-weight:600">${d.adresse}</td></tr>
          <tr><td style="padding:6px 0;color:#555">E-Mail</td><td style="padding:6px 0;font-weight:600">${d.email}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Telefon</td><td style="padding:6px 0;font-weight:600">${d.telefon || '—'}</td></tr>
        </table>

        <h2 style="font-size:16px;border-bottom:2px solid #e63946;padding-bottom:8px;margin:24px 0 16px">
          Tarifwahl
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:40%">Kategorie</td><td style="padding:6px 0;font-weight:600">${d.kategorie}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Laufzeit</td><td style="padding:6px 0;font-weight:600">${laufzeitLabel[d.laufzeit]}</td></tr>
        </table>

        <h2 style="font-size:16px;border-bottom:2px solid #e63946;padding-bottom:8px;margin:24px 0 16px">
          SEPA-Lastschrift
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:40%">Kontoinhaber</td><td style="padding:6px 0;font-weight:600">${d.kontoinhaber}</td></tr>
          <tr><td style="padding:6px 0;color:#555">IBAN</td><td style="padding:6px 0;font-weight:600;letter-spacing:2px">${d.iban}</td></tr>
          <tr><td style="padding:6px 0;color:#555">BIC</td><td style="padding:6px 0;font-weight:600">${d.bic || '—'}</td></tr>
        </table>

        ${d.nachricht ? `
        <h2 style="font-size:16px;border-bottom:2px solid #e63946;padding-bottom:8px;margin:24px 0 16px">
          Nachricht
        </h2>
        <p style="font-size:14px;line-height:1.6">${d.nachricht}</p>
        ` : ''}

        <div style="margin-top:32px;padding:16px;background:#f9f9f9;border-left:3px solid #e63946;font-size:13px;color:#555">
          Bitte Mitgliedsvertrag ausdrucken, unterschreiben und beim ersten Training mitbringen<br>
          oder unterschrieben einscannen und an <strong>office@axisjj.at</strong> senden.
        </div>
      </div>

      <div style="margin-top:32px;padding:16px 32px;background:#f5f5f5;font-size:11px;color:#999;text-align:center">
        Axis Jiu-Jitsu Vienna · Strindberggasse 1/R01, 1110 Wien · office@axisjj.at
      </div>
    </div>
  `

  const text = [
    `MITGLIEDSANTRAG — ${d.vorname} ${d.nachname}`,
    '',
    `Name: ${d.vorname} ${d.nachname}`,
    `Geburtsdatum: ${d.geburtsdatum}`,
    `Adresse: ${d.adresse}`,
    `E-Mail: ${d.email}`,
    `Telefon: ${d.telefon || '—'}`,
    '',
    `Kategorie: ${d.kategorie}`,
    `Laufzeit: ${laufzeitLabel[d.laufzeit]}`,
    '',
    `Kontoinhaber: ${d.kontoinhaber}`,
    `IBAN: ${d.iban}`,
    `BIC: ${d.bic || '—'}`,
    d.nachricht ? `\nNachricht: ${d.nachricht}` : '',
  ].join('\n')

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    console.error('[membership] Missing GMAIL_USER or GMAIL_APP_PASSWORD')
    return { error: 'E-Mail-Versand nicht konfiguriert.' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    })
    await transporter.sendMail({
      from: gmailUser,
      to: RECIPIENT,
      replyTo: d.email,
      subject,
      text,
      html,
    })
  } catch (err) {
    console.error('[membership] email error:', err)
    return { error: 'Senden fehlgeschlagen. Bitte versuche es erneut oder schreib uns direkt.' }
  }

  return { success: true }
}
