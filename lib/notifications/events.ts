export type NotificationEvent =
  | { type: 'lead.created'; data: { full_name: string; email: string; phone?: string | null; message?: string | null; source: 'website' | 'instagram' } }
  | { type: 'lead.status_changed'; data: { full_name: string; email: string; oldStatus: string; newStatus: string } }
  | { type: 'user.registered'; data: { full_name: string; email: string } }
  | { type: 'user.login'; data: { full_name: string; email: string } }
  | { type: 'booking.created'; data: { memberName: string; className: string; startsAt: string; status: 'confirmed' | 'waitlisted' } }
  | { type: 'booking.cancelled'; data: { memberName: string; className: string; startsAt: string } }
  | { type: 'checkin.recorded'; data: { memberName: string; className: string; startsAt: string } }
  | { type: 'session.created'; data: { className: string; startsAt: string; capacity: number } }
  | { type: 'session.updated'; data: { className: string; startsAt: string } }
  | { type: 'session.cancelled'; data: { className: string; startsAt: string } }
  | { type: 'belt.promoted'; data: { memberName: string; fromBelt: string; toBelt: string } }
  | { type: 'member.updated'; data: { memberName: string; changedFields: string[] } }
  | { type: 'member.role_changed'; data: { memberName: string; oldRole: string; newRole: string } }
  | { type: 'classtype.upserted'; data: { name: string; isNew: boolean } }
  | { type: 'classtype.deleted'; data: { name: string } }
  | { type: 'gym.info_updated'; data: Record<string, never> }
  | { type: 'gym.hours_updated'; data: Record<string, never> }
  | { type: 'gym.policies_updated'; data: Record<string, never> }

export interface FormattedNotification {
  emailSubject: string
  emailText: string
  emailHtml: string
  telegramMarkdown: string
}

const MDV2_RESERVED = /[_*[\]()~`>#+\-=|{}.!]/g

export function escapeMdV2(text: string): string {
  return text.replace(MDV2_RESERVED, (ch) => '\\' + ch)
}

function formatDateDE(iso: string, now?: Date): string {
  let date: Date
  try {
    date = iso ? new Date(iso) : now ?? new Date()
    if (isNaN(date.getTime())) {
      date = now ?? new Date()
    }
  } catch {
    date = now ?? new Date()
  }
  const fmt = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Vienna',
  })
  const parts = fmt.formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const day = get('day')
  const month = get('month').replace('.', '')
  const year = get('year')
  const hour = get('hour')
  const minute = get('minute')
  return `${day}. ${month} ${year}, ${hour}:${minute}`
}

interface EmailHtmlPart {
  label?: string
  value: string
}

function buildEmailHtml(title: string, parts: EmailHtmlPart[], timeLine: string): string {
  const rows = parts
    .map((p) => (p.label ? `<strong>${p.label}:</strong> ${escapeHtml(p.value)}` : escapeHtml(p.value)))
    .join('<br/>')
  return `<div style="font-family:system-ui;"><strong>${escapeHtml(title)}</strong><br/>${rows}<br/><br/>${escapeHtml(timeLine)}</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmailText(title: string, rows: Array<[string, string] | string>, timeLine: string): string {
  const body = rows
    .map((r) => (Array.isArray(r) ? `${r[0]}: ${r[1]}` : r))
    .join('\n')
  return `${title}\n${body}\n\n${timeLine}`
}

function buildTelegram(emoji: string, title: string, rows: Array<[string, string]>): string {
  const header = `${emoji} *${escapeMdV2(title)}*`
  const body = rows.map(([k, v]) => `*${escapeMdV2(k)}:* ${escapeMdV2(v)}`).join('\n')
  return body ? `${header}\n${body}` : header
}

export function formatEvent(event: NotificationEvent, now?: Date): FormattedNotification {
  const nowDate = now ?? new Date()
  const timeLine = `Zeit: ${formatDateDE(nowDate.toISOString(), nowDate)} CEST`

  switch (event.type) {
    case 'lead.created': {
      const { full_name, email, phone, message, source } = event.data
      const sourceLabel = source === 'instagram' ? 'Instagram' : 'Website'
      const title = 'Neuer Lead eingegangen'
      const subject = `[AXIS] Neuer Lead: ${full_name}`
      const rows: Array<[string, string]> = [
        ['Name', full_name],
        ['E-Mail', email],
      ]
      if (phone) rows.push(['Telefon', phone])
      rows.push(['Quelle', sourceLabel])
      if (message) rows.push(['Nachricht', message])
      return {
        emailSubject: subject,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🆕', 'Neuer Lead', rows),
      }
    }
    case 'lead.status_changed': {
      const { full_name, email, oldStatus, newStatus } = event.data
      const title = 'Lead-Status geändert'
      const rows: Array<[string, string]> = [
        ['Name', full_name],
        ['E-Mail', email],
        ['Alt', oldStatus],
        ['Neu', newStatus],
      ]
      return {
        emailSubject: `[AXIS] Lead-Status: ${full_name} (${oldStatus} → ${newStatus})`,
        emailText: buildEmailText(title, [...rows, `Wechsel: ${oldStatus} → ${newStatus}`], timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🔄', 'Lead-Status geändert', rows),
      }
    }
    case 'user.registered': {
      const { full_name, email } = event.data
      const title = 'Neue Registrierung'
      const rows: Array<[string, string]> = [['Name', full_name], ['E-Mail', email]]
      return {
        emailSubject: `[AXIS] Neue Registrierung: ${full_name}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🆕', 'Neue Registrierung', rows),
      }
    }
    case 'user.login': {
      const { full_name, email } = event.data
      const title = 'Login'
      const rows: Array<[string, string]> = [['Name', full_name], ['E-Mail', email]]
      return {
        emailSubject: `[AXIS] Login: ${full_name}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('👤', 'Login', rows),
      }
    }
    case 'booking.created': {
      const { memberName, className, startsAt, status } = event.data
      const title = 'Neue Buchung'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
        ['Status', status],
      ]
      return {
        emailSubject: `[AXIS] Neue Buchung: ${memberName} – ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🆕', 'Neue Buchung', rows),
      }
    }
    case 'booking.cancelled': {
      const { memberName, className, startsAt } = event.data
      const title = 'Buchung storniert'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      return {
        emailSubject: `[AXIS] Buchung storniert: ${memberName} – ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('❌', 'Buchung storniert', rows),
      }
    }
    case 'checkin.recorded': {
      const { memberName, className, startsAt } = event.data
      const title = 'Check-in'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      return {
        emailSubject: `[AXIS] Check-in: ${memberName} – ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('✅', 'Check-in', rows),
      }
    }
    case 'session.created': {
      const { className, startsAt, capacity } = event.data
      const title = 'Neue Session'
      const rows: Array<[string, string]> = [
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
        ['Kapazität', String(capacity)],
      ]
      return {
        emailSubject: `[AXIS] Neue Session: ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🆕', 'Neue Session', rows),
      }
    }
    case 'session.updated': {
      const { className, startsAt } = event.data
      const title = 'Session aktualisiert'
      const rows: Array<[string, string]> = [
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      return {
        emailSubject: `[AXIS] Session aktualisiert: ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🔄', 'Session aktualisiert', rows),
      }
    }
    case 'session.cancelled': {
      const { className, startsAt } = event.data
      const title = 'Session abgesagt'
      const rows: Array<[string, string]> = [
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      return {
        emailSubject: `[AXIS] Session abgesagt: ${className}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('❌', 'Session abgesagt', rows),
      }
    }
    case 'belt.promoted': {
      const { memberName, fromBelt, toBelt } = event.data
      const title = 'Gurt-Beförderung'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Von', fromBelt],
        ['Nach', toBelt],
      ]
      return {
        emailSubject: `[AXIS] Beförderung: ${memberName} (${fromBelt} → ${toBelt})`,
        emailText: buildEmailText(title, [...rows, `Wechsel: ${fromBelt} → ${toBelt}`], timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🥋', 'Gurt-Beförderung', rows),
      }
    }
    case 'member.updated': {
      const { memberName, changedFields } = event.data
      const title = 'Mitglied aktualisiert'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Geändert', changedFields.join(', ')],
      ]
      return {
        emailSubject: `[AXIS] Mitglied aktualisiert: ${memberName}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🔧', 'Mitglied aktualisiert', rows),
      }
    }
    case 'member.role_changed': {
      const { memberName, oldRole, newRole } = event.data
      const title = 'Rolle geändert'
      const rows: Array<[string, string]> = [
        ['Mitglied', memberName],
        ['Alt', oldRole],
        ['Neu', newRole],
      ]
      return {
        emailSubject: `[AXIS] Rolle geändert: ${memberName} (${oldRole} → ${newRole})`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('🔧', 'Rolle geändert', rows),
      }
    }
    case 'classtype.upserted': {
      const { name, isNew } = event.data
      const title = isNew ? 'Neue Kursart' : 'Kursart aktualisiert'
      const rows: Array<[string, string]> = [['Name', name]]
      return {
        emailSubject: `[AXIS] ${title}: ${name}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram(isNew ? '🆕' : '🔄', title, rows),
      }
    }
    case 'classtype.deleted': {
      const { name } = event.data
      const title = 'Kursart gelöscht'
      const rows: Array<[string, string]> = [['Name', name]]
      return {
        emailSubject: `[AXIS] Kursart gelöscht: ${name}`,
        emailText: buildEmailText(title, rows, timeLine),
        emailHtml: buildEmailHtml(title, rows.map(([k, v]) => ({ label: k, value: v })), timeLine),
        telegramMarkdown: buildTelegram('❌', 'Kursart gelöscht', rows),
      }
    }
    case 'gym.info_updated': {
      const title = 'Gym-Info aktualisiert'
      return {
        emailSubject: `[AXIS] Gym-Info aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('⚙️', 'Gym-Info aktualisiert', []),
      }
    }
    case 'gym.hours_updated': {
      const title = 'Öffnungszeiten aktualisiert'
      return {
        emailSubject: `[AXIS] Öffnungszeiten aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('⚙️', 'Öffnungszeiten aktualisiert', []),
      }
    }
    case 'gym.policies_updated': {
      const title = 'Richtlinien aktualisiert'
      return {
        emailSubject: `[AXIS] Richtlinien aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('⚙️', 'Richtlinien aktualisiert', []),
      }
    }
  }
}
