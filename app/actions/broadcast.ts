'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { assertOwner } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import nodemailer from 'nodemailer'
import { bulkCreateDiscountCodes } from './discount-codes'

export interface BroadcastRecord {
  id: string
  title: string
  subject: string
  body: string
  image_url: string | null
  channels: string[]
  target_group: string
  message_type: 'text' | 'offer'
  offer_discount_pct: number | null
  offer_expires_days: number | null
  status: 'draft' | 'sending' | 'sent' | 'failed'
  sent_at: string | null
  email_sent: number
  email_failed: number
  telegram_sent: number
  telegram_failed: number
  recipient_count: number
  created_at: string
}

export interface BroadcastInput {
  title: string
  subject: string
  body: string
  image_url?: string | null
  channels: ('email' | 'telegram')[]
  target_group: 'all' | 'active' | 'inactive' | 'leads' | string   // string for 'group:<id>'
  message_type: 'text' | 'offer'
  offer_discount_pct?: number | null
  offer_expires_days?: number | null
}

// ── List broadcasts ───────────────────────────────────────────

export async function listBroadcasts(): Promise<BroadcastRecord[]> {
  const check = await assertOwner()
  if ('error' in check) return []

  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (data ?? []) as BroadcastRecord[]
}

// ── Resolve target recipients ─────────────────────────────────

async function resolveRecipients(target_group: string): Promise<
  { id: string | null; email: string; name: string | null }[]
> {
  const svc = createServiceRoleClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString()

  if (target_group === 'leads') {
    const { data } = await svc.from('leads').select('email, full_name').eq('status', 'new')
    return (data ?? []).map((r: any) => ({ id: null, email: r.email, name: r.full_name }))
  }

  if (target_group === 'all') {
    const { data } = await svc.from('profiles').select('id, email, full_name').eq('role', 'member')
    return (data ?? []).filter((r: any) => r.email).map((r: any) => ({ id: r.id, email: r.email, name: r.full_name }))
  }

  if (target_group === 'active') {
    // Members who attended in last 30 days
    const { data: atts } = await svc
      .from('attendances')
      .select('profile_id')
      .gte('checked_in_at', thirtyDaysAgo)
    const ids = [...new Set((atts ?? []).map((a: any) => a.profile_id as string))]
    if (!ids.length) return []
    const { data } = await svc.from('profiles').select('id, email, full_name').in('id', ids)
    return (data ?? []).filter((r: any) => r.email).map((r: any) => ({ id: r.id, email: r.email, name: r.full_name }))
  }

  if (target_group === 'inactive') {
    // Members with role=member who have NOT attended in 30 days (or never)
    const { data: atts } = await svc
      .from('attendances')
      .select('profile_id')
      .gte('checked_in_at', thirtyDaysAgo)
    const recentIds = new Set((atts ?? []).map((a: any) => a.profile_id as string))
    const { data: members } = await svc.from('profiles').select('id, email, full_name').eq('role', 'member')
    return (members ?? [])
      .filter((r: any) => r.email && !recentIds.has(r.id))
      .map((r: any) => ({ id: r.id, email: r.email, name: r.full_name }))
  }

  if (target_group.startsWith('group:')) {
    const groupId = target_group.slice(6)
    const { data: members } = await (svc as any)
      .from('training_group_members')
      .select('profile_id')
      .eq('group_id', groupId)
    const ids = (members ?? []).map((m: any) => m.profile_id as string)
    if (!ids.length) return []
    const { data } = await svc.from('profiles').select('id, email, full_name').in('id', ids)
    return (data ?? []).filter((r: any) => r.email).map((r: any) => ({ id: r.id, email: r.email, name: r.full_name }))
  }

  return []
}

// ── Build rich HTML email ─────────────────────────────────────

function buildEmailHtml(
  subject: string,
  body: string,
  imageUrl: string | null,
  discountCode?: string | null,
  discountLabel?: string | null,
  expiresAt?: string | null,
): string {
  const paragraphs = body
    .split(/\n\n+/)
    .map(p =>
      `<p style="margin:0 0 1.2em;line-height:1.7">${p
        .replace(/\n/g, '<br>')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      }</p>`
    )
    .join('')

  const imageBlock = imageUrl
    ? `<img src="${imageUrl}" alt="" style="width:100%;max-width:600px;display:block;margin:0 0 20px" />`
    : ''

  const offerBlock = discountCode ? `
    <div style="margin:24px 0;padding:20px 24px;background:#111;border-left:4px solid #dc2626;text-align:center">
      <p style="color:#999;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Dein persönlicher Rabatt-Code</p>
      <p style="color:#fff;font-size:28px;font-weight:900;letter-spacing:4px;margin:0 0 8px;font-family:monospace">${discountCode}</p>
      ${discountLabel ? `<p style="color:#dc2626;font-size:14px;font-weight:700;margin:0 0 8px">${discountLabel}</p>` : ''}
      ${expiresAt ? `<p style="color:#666;font-size:11px;margin:0">Gültig bis ${new Date(expiresAt).toLocaleDateString('de-AT', { day:'2-digit', month:'long', year:'numeric' })}</p>` : ''}
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="https://axisjj.at/anmelden" style="display:inline-block;background:#dc2626;color:#fff;font-weight:900;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none">
        Jetzt Mitglied werden →
      </a>
    </div>
  ` : ''

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;background:#fff">
      <div style="background:#111;padding:20px 28px">
        <h1 style="color:#fff;margin:0;font-size:18px;letter-spacing:3px;font-weight:900">AXIS JIU-JITSU VIENNA</h1>
      </div>
      ${imageBlock}
      <div style="padding:28px">
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:900;color:#111">${subject.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h2>
        ${paragraphs}
        ${offerBlock}
      </div>
      <div style="padding:14px 28px;background:#f8f8f8;font-size:11px;color:#999;text-align:center;border-top:1px solid #e5e5e5">
        Du erhältst diese Nachricht als Mitglied oder Interessent von AXIS Jiu-Jitsu Vienna.
      </div>
    </div>
  `.trim()
}

// ── Send via Telegram (bot fan-out) ──────────────────────────

async function sendTelegram(
  recipients: { id: string | null }[],
  text: string,
): Promise<{ sent: number; failed: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { sent: 0, failed: 0 }

  const svc = createServiceRoleClient()
  const profileIds = recipients.map(r => r.id).filter(Boolean) as string[]
  if (!profileIds.length) return { sent: 0, failed: 0 }

  const { data: botUsers } = await (svc as any)
    .from('bot_users')
    .select('chat_id, profile_id')
    .in('profile_id', profileIds)

  let sent = 0; let failed = 0
  for (const bu of (botUsers ?? []) as any[]) {
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: bu.chat_id,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      })
      if (res.ok) sent++
      else failed++
    } catch {
      failed++
    }
    // Respect Telegram rate limit: ~30 msg/sec
    await new Promise(r => setTimeout(r, 40))
  }

  return { sent, failed }
}

// ── Main send action ──────────────────────────────────────────

export async function sendBroadcast(
  input: BroadcastInput,
): Promise<{ success?: true; broadcastId?: string; error?: string; sent?: number }> {
  if (!input.title?.trim()) return { error: 'Titel fehlt.' }
  if (!input.subject?.trim()) return { error: 'Betreff fehlt.' }
  if (!input.body?.trim()) return { error: 'Nachricht fehlt.' }
  if (!input.channels?.length) return { error: 'Mindestens einen Kanal auswählen.' }

  const check = await assertOwner()
  if ('error' in check) return { error: check.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create broadcast record
  const { data: broadcast, error: bcError } = await (supabase as any)
    .from('broadcasts')
    .insert({
      title: input.title,
      subject: input.subject,
      body: input.body,
      image_url: input.image_url ?? null,
      channels: input.channels,
      target_group: input.target_group,
      message_type: input.message_type,
      offer_discount_pct: input.offer_discount_pct ?? null,
      offer_expires_days: input.offer_expires_days ?? null,
      status: 'sending',
      created_by: user?.id,
    })
    .select('id')
    .single()

  if (bcError || !broadcast) return { error: bcError?.message ?? 'Broadcast konnte nicht angelegt werden.' }
  const broadcastId: string = broadcast.id

  // Resolve recipients
  const recipients = await resolveRecipients(input.target_group)
  if (!recipients.length) {
    await (supabase as any).from('broadcasts').update({ status: 'failed' }).eq('id', broadcastId)
    return { error: 'Keine Empfänger für diese Zielgruppe gefunden.' }
  }

  // Generate personal discount codes if offer type
  let codesMap = new Map<string, { code: string; label: string; expiresAt: string | null }>()
  if (input.message_type === 'offer' && input.offer_discount_pct && input.offer_expires_days) {
    const { codes } = await bulkCreateDiscountCodes({
      recipients: recipients.map(r => ({ email: r.email, profile_id: r.id })),
      discount_type: 'percent',
      discount_value: input.offer_discount_pct,
      expires_days: input.offer_expires_days,
      description: `Broadcast: ${input.title}`,
      broadcast_id: broadcastId,
    })
    const expiresAt = new Date(Date.now() + input.offer_expires_days * 86400_000).toISOString()
    codes.forEach((code, i) => {
      const email = recipients[i]?.email
      if (email) {
        codesMap.set(email, {
          code,
          label: `${input.offer_discount_pct}% Rabatt`,
          expiresAt,
        })
      }
    })
  }

  let emailSent = 0; let emailFailed = 0
  let telegramSent = 0; let telegramFailed = 0

  // ── Email ──
  if (input.channels.includes('email')) {
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: gmailUser, pass: gmailPass },
      })

      for (const r of recipients) {
        const offerData = codesMap.get(r.email)
        const html = buildEmailHtml(
          input.subject,
          input.body,
          input.image_url ?? null,
          offerData?.code ?? null,
          offerData?.label ?? null,
          offerData?.expiresAt ?? null,
        )

        // Personalise body if offer
        let personalBody = input.body
        if (offerData) {
          personalBody += `\n\nDein persönlicher Rabatt-Code: ${offerData.code}\n${offerData.label}`
          if (offerData.expiresAt) {
            personalBody += `\nGültig bis: ${new Date(offerData.expiresAt).toLocaleDateString('de-AT')}`
          }
        }

        try {
          await transporter.sendMail({
            from: `AXIS Jiu-Jitsu Vienna <${gmailUser}>`,
            to: r.email,
            subject: input.subject,
            text: personalBody,
            html,
          })
          emailSent++
        } catch (err) {
          console.error('[broadcast] email failed for', r.email, err)
          emailFailed++
        }
      }
    }
  }

  // ── Telegram ──
  if (input.channels.includes('telegram')) {
    let telegramText = `*${input.subject}*\n\n${input.body}`
    if (input.message_type === 'offer' && input.offer_discount_pct) {
      telegramText += `\n\n🎁 *Sonderangebot: ${input.offer_discount_pct}% Rabatt!*`
      if (input.offer_expires_days) {
        telegramText += `\nAngebot gültig für ${input.offer_expires_days} Tage.`
      }
      telegramText += '\n\n👉 axisjj.at/anmelden'
    }
    const tgResult = await sendTelegram(recipients, telegramText)
    telegramSent = tgResult.sent
    telegramFailed = tgResult.failed
  }

  // Update broadcast record
  await (supabase as any).from('broadcasts').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    email_sent: emailSent,
    email_failed: emailFailed,
    telegram_sent: telegramSent,
    telegram_failed: telegramFailed,
    recipient_count: recipients.length,
  }).eq('id', broadcastId)

  await logAudit({
    action: 'broadcast.sent',
    targetType: 'broadcast',
    targetId: broadcastId,
    targetName: input.title,
    meta: {
      target_group: input.target_group,
      channels: input.channels,
      recipients: recipients.length,
      email_sent: emailSent,
      telegram_sent: telegramSent,
    },
  })

  revalidatePath('/admin/broadcast')
  return { success: true, broadcastId, sent: emailSent + telegramSent }
}
