import nodemailer from 'nodemailer'
import type { FormattedNotification } from './events'

export async function sendEmail(formatted: FormattedNotification): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const to = process.env.NOTIFICATION_RECIPIENT
  if (!user || !pass || !to) {
    console.log('[notifications] email skipped: missing env vars')
    return
  }
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from: user,
      to,
      subject: formatted.emailSubject,
      text: formatted.emailText,
      html: formatted.emailHtml,
    })
  } catch (err) {
    console.error('[notifications] email error:', err)
  }
}
