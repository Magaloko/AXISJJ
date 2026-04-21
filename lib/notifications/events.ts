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
  | { type: 'waitlist.promoted'; data: { memberName: string; memberEmail: string; className: string; startsAt: string } }
  | { type: 'training.reminder'; data: { memberName: string; memberEmail: string; className: string; startsAt: string; location: string | null } }
  | { type: 'member.belt_promoted'; data: { memberName: string; memberEmail: string; fromBelt: string; toBelt: string } }
  | { type: 'trial.confirmation'; data: { fullName: string; email: string } }
  | { type: 'monthly.report'; data: { memberName: string; memberEmail: string; month: string; trainings: number; streak: number; avgMoodLift: number | null } }
  | { type: 'birthday.wish'; data: { memberName: string; memberEmail: string; age: number } }

export interface FormattedNotification {
  emailSubject: string
  emailText: string
  emailHtml: string
  telegramMarkdown: string
  /** If set, email goes directly to this address instead of NOTIFICATION_RECIPIENT */
  emailToOverride?: string
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

function buildTelegram(title: string, rows: Array<[string, string]>): string {
  const header = `*${escapeMdV2(title)}*`
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
        telegramMarkdown: buildTelegram('Neuer Lead', rows),
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
        telegramMarkdown: buildTelegram('Lead-Status geändert', rows),
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
        telegramMarkdown: buildTelegram('Neue Registrierung', rows),
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
        telegramMarkdown: buildTelegram('Login', rows),
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
        telegramMarkdown: buildTelegram('Neue Buchung', rows),
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
        telegramMarkdown: buildTelegram('Buchung storniert', rows),
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
        telegramMarkdown: buildTelegram('Check-in', rows),
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
        telegramMarkdown: buildTelegram('Neue Session', rows),
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
        telegramMarkdown: buildTelegram('Session aktualisiert', rows),
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
        telegramMarkdown: buildTelegram('Session abgesagt', rows),
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
        telegramMarkdown: buildTelegram('Gurt-Beförderung', rows),
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
        telegramMarkdown: buildTelegram('Mitglied aktualisiert', rows),
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
        telegramMarkdown: buildTelegram('Rolle geändert', rows),
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
        telegramMarkdown: buildTelegram(title, rows),
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
        telegramMarkdown: buildTelegram('Kursart gelöscht', rows),
      }
    }
    case 'gym.info_updated': {
      const title = 'Gym-Info aktualisiert'
      return {
        emailSubject: `[AXIS] Gym-Info aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('Gym-Info aktualisiert', []),
      }
    }
    case 'gym.hours_updated': {
      const title = 'Öffnungszeiten aktualisiert'
      return {
        emailSubject: `[AXIS] Öffnungszeiten aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('Öffnungszeiten aktualisiert', []),
      }
    }
    case 'gym.policies_updated': {
      const title = 'Richtlinien aktualisiert'
      return {
        emailSubject: `[AXIS] Richtlinien aktualisiert`,
        emailText: buildEmailText(title, [], timeLine),
        emailHtml: buildEmailHtml(title, [], timeLine),
        telegramMarkdown: buildTelegram('Richtlinien aktualisiert', []),
      }
    }
    case 'waitlist.promoted': {
      const { memberName, memberEmail, className, startsAt } = event.data
      const title = 'Du bist eingeteilt!'
      const rows: Array<[string, string]> = [
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      return {
        emailSubject: `Gute Nachrichten: Du bist jetzt für ${className} bestätigt`,
        emailText: buildEmailText(
          `Hallo ${memberName}!`,
          [
            `Ein Platz ist frei geworden — du bist jetzt für ${className} am ${formatDateDE(startsAt)} bestätigt.`,
            `Bis bald auf der Matte!`,
          ],
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui">
          <h2 style="color:#e63946">Du bist eingeteilt!</h2>
          <p>Hallo ${escapeHtml(memberName)},</p>
          <p>ein Platz ist frei geworden — du bist jetzt für <strong>${escapeHtml(className)}</strong> am <strong>${escapeHtml(formatDateDE(startsAt))}</strong> bestätigt.</p>
          <p>Bis bald auf der Matte!</p>
          <p style="color:#999;font-size:12px">${escapeHtml(timeLine)}</p>
        </div>`,
        telegramMarkdown: buildTelegram(title, rows),
        emailToOverride: memberEmail,
      }
    }
    case 'birthday.wish': {
      const { memberName, memberEmail, age } = event.data
      const title = `Alles Gute zum ${age}. Geburtstag!`
      return {
        emailSubject: title,
        emailText: buildEmailText(
          `Hallo ${memberName}!`,
          [
            `alles Gute zum ${age}. Geburtstag!`,
            '',
            'Feier schön und bleib auf der Matte.',
            '',
            'Dein AXIS-Team',
          ],
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;color:#111">
          <div style="background:#111;padding:24px 32px;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
            <p style="color:#888;margin:4px 0 0;font-size:13px">Herzlichen Glückwunsch</p>
          </div>
          <div style="padding:0 32px">
            <h2 style="color:#e63946">Hey ${escapeHtml(memberName)}!</h2>
            <p style="font-size:16px">Alles Gute zum <strong>${age}. Geburtstag</strong>!</p>
            <p>Feier schön und bleib auf der Matte.</p>
            <p style="color:#999;font-size:13px;margin-top:32px">Dein AXIS-Team</p>
          </div>
        </div>`,
        telegramMarkdown: `*${escapeMdV2(title)}*\n${escapeMdV2('An: ' + memberName)}`,
        emailToOverride: memberEmail,
      }
    }
    case 'monthly.report': {
      const { memberName, memberEmail, month, trainings, streak, avgMoodLift } = event.data
      const title = `Dein ${month} bei AXIS`
      const motivation =
        trainings === 0 ? 'Wir haben dich vermisst — komm gerne bald wieder auf die Matte!'
      : trainings >= 12 ? 'Mega Monat! Du zeigst was es heißt, wirklich committed zu sein.'
      : trainings >= 6  ? 'Solider Monat — du bist auf dem richtigen Weg!'
      : `${trainings} Training${trainings !== 1 ? 's' : ''} — jedes zählt. Nächster Monat wird stärker.`
      return {
        emailSubject: title,
        emailText: buildEmailText(
          `Hallo ${memberName}!`,
          [
            `Hier dein ${month}-Rückblick:`,
            '',
            `Trainings: ${trainings}`,
            streak > 0 ? `Aktuelle Streak: ${streak} Tage` : '',
            avgMoodLift !== null ? `Ø Stimmungsveränderung: ${avgMoodLift > 0 ? '+' : ''}${avgMoodLift}` : '',
            '',
            motivation,
            '',
            'Bis bald auf der Matte!',
          ].filter(Boolean),
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;color:#111">
          <div style="background:#111;padding:24px 32px;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
            <p style="color:#888;margin:4px 0 0;font-size:13px">Monatsrückblick · ${escapeHtml(month)}</p>
          </div>
          <div style="padding:0 32px">
            <h2 style="color:#e63946">Hallo ${escapeHtml(memberName)}!</h2>
            <p>hier ist dein ${escapeHtml(month)}-Rückblick:</p>

            <div style="background:#f5f5f5;padding:20px;margin:20px 0;display:table;width:100%">
              <div style="display:table-row">
                <div style="display:table-cell;padding:8px;font-size:32px;font-weight:900;color:#e63946;text-align:center">${trainings}</div>
                <div style="display:table-cell;padding:8px;font-size:32px;font-weight:900;color:${streak > 0 ? '#e63946' : '#999'};text-align:center">${streak > 0 ? streak : '—'}</div>
                <div style="display:table-cell;padding:8px;font-size:32px;font-weight:900;color:${avgMoodLift !== null && avgMoodLift > 0 ? '#e63946' : '#999'};text-align:center">${avgMoodLift !== null ? (avgMoodLift > 0 ? '+' : '') + avgMoodLift : '—'}</div>
              </div>
              <div style="display:table-row;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px">
                <div style="display:table-cell;padding:0 8px 8px;text-align:center">Trainings</div>
                <div style="display:table-cell;padding:0 8px 8px;text-align:center">Streak</div>
                <div style="display:table-cell;padding:0 8px 8px;text-align:center">Ø Stimmung</div>
              </div>
            </div>

            <p style="font-size:15px;color:#333;line-height:1.6">${escapeHtml(motivation)}</p>
            <p>Bis bald auf der Matte!</p>
          </div>
        </div>`,
        telegramMarkdown: `*${escapeMdV2(title)}*\n${escapeMdV2('An: ' + memberName + ' | ' + trainings + ' Trainings')}`,
        emailToOverride: memberEmail,
      }
    }
    case 'trial.confirmation': {
      const { fullName, email } = event.data
      const title = 'Danke für deine Anmeldung!'
      return {
        emailSubject: 'AXIS Jiu-Jitsu — Deine Probetraining-Anmeldung ist eingegangen',
        emailText: buildEmailText(
          `Hallo ${fullName}!`,
          [
            'deine kostenlose Probetrainings-Woche ist bei uns angekommen.',
            '',
            'Nächste Schritte:',
            '1. Wir melden uns innerhalb von 24 Stunden zurück',
            '2. Wir fixieren gemeinsam deinen ersten Termin',
            '3. Komm einfach in Trainingskleidung — Matten-Equipment kannst du bei uns leihen',
            '',
            'Trainingszeiten: axisjj.vercel.app/#trainingsplan',
            'Ort: Strindberggasse 1/R01, 1110 Wien',
            'Kontakt: office@axisjj.at',
            '',
            'Bis bald auf der Matte!',
            '',
            'Axis Jiu-Jitsu Vienna',
          ],
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;color:#111">
          <div style="background:#111;padding:24px 32px;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">AXIS JIU-JITSU VIENNA</h1>
            <p style="color:#888;margin:4px 0 0;font-size:13px">Probetraining-Bestätigung</p>
          </div>
          <div style="padding:0 32px">
            <h2 style="color:#e63946">Danke ${escapeHtml(fullName)}!</h2>
            <p>deine kostenlose Probetrainings-Woche ist bei uns angekommen.</p>

            <h3 style="margin-top:24px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#555">Nächste Schritte</h3>
            <ol style="padding-left:20px;line-height:1.7">
              <li>Wir melden uns <strong>innerhalb von 24 Stunden</strong> zurück</li>
              <li>Wir fixieren gemeinsam deinen ersten Termin</li>
              <li>Komm in Trainingskleidung — Equipment stellen wir</li>
            </ol>

            <div style="background:#f5f5f5;border-left:3px solid #e63946;padding:16px 20px;margin:20px 0;font-size:14px">
              <p style="margin:0 0 8px"><strong>Ort:</strong> Strindberggasse 1/R01, 1110 Wien</p>
              <p style="margin:0 0 8px"><strong>Kontakt:</strong> office@axisjj.at</p>
              <p style="margin:0"><strong>Trainingszeiten:</strong> <a href="https://axisjj.vercel.app/#trainingsplan" style="color:#e63946">axisjj.vercel.app</a></p>
            </div>

            <p>Bis bald auf der Matte!</p>
            <p style="color:#999;font-size:13px;margin-top:32px">Dein AXIS-Team</p>
          </div>
          <div style="margin-top:32px;padding:16px 32px;background:#f5f5f5;font-size:11px;color:#999;text-align:center">
            Du hast diese E-Mail erhalten weil du dich auf axisjj.vercel.app/trial angemeldet hast.
          </div>
        </div>`,
        telegramMarkdown: `*${escapeMdV2(title)}*\n${escapeMdV2('An: ' + fullName)}`,
        emailToOverride: email,
      }
    }
    case 'member.belt_promoted': {
      const { memberName, memberEmail, fromBelt, toBelt } = event.data
      const title = 'Herzlichen Glückwunsch zur Beförderung!'
      const rows: Array<[string, string]> = [
        ['Von', fromBelt],
        ['Nach', toBelt],
      ]
      return {
        emailSubject: `Glückwunsch zur Beförderung: ${toBelt}`,
        emailText: buildEmailText(
          `Hallo ${memberName}!`,
          [
            `Du wurdest zum ${toBelt} befördert.`,
            `Von: ${fromBelt} → ${toBelt}`,
            `Weiter so — du hast es dir verdient!`,
          ],
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui">
          <h2 style="color:#e63946">Herzlichen Glückwunsch!</h2>
          <p>Hallo ${escapeHtml(memberName)},</p>
          <p>du wurdest zum <strong>${escapeHtml(toBelt)}</strong> befördert.</p>
          <p><strong>${escapeHtml(fromBelt)}</strong> → <strong>${escapeHtml(toBelt)}</strong></p>
          <p>Weiter so — du hast es dir verdient!</p>
        </div>`,
        telegramMarkdown: buildTelegram(title, rows),
        emailToOverride: memberEmail,
      }
    }
    case 'training.reminder': {
      const { memberName, memberEmail, className, startsAt, location } = event.data
      const title = 'Dein Training morgen'
      const rows: Array<[string, string]> = [
        ['Kurs', className],
        ['Beginn', formatDateDE(startsAt)],
      ]
      if (location) rows.push(['Ort', location])
      return {
        emailSubject: `Erinnerung: ${className} am ${formatDateDE(startsAt)}`,
        emailText: buildEmailText(
          `Hallo ${memberName}!`,
          [
            `Erinnerung: Du hast morgen ${className} gebucht — Beginn ${formatDateDE(startsAt)}.`,
            location ? `Ort: ${location}` : '',
            `Bis bald auf der Matte!`,
          ].filter(Boolean),
          timeLine
        ),
        emailHtml: `<div style="font-family:system-ui">
          <h2 style="color:#e63946">Erinnerung: Training morgen</h2>
          <p>Hallo ${escapeHtml(memberName)},</p>
          <p>du hast morgen <strong>${escapeHtml(className)}</strong> gebucht.</p>
          <p><strong>Beginn:</strong> ${escapeHtml(formatDateDE(startsAt))}${location ? `<br/><strong>Ort:</strong> ${escapeHtml(location)}` : ''}</p>
          <p>Bis bald auf der Matte!</p>
        </div>`,
        telegramMarkdown: buildTelegram(title, rows),
        emailToOverride: memberEmail,
      }
    }
  }
}
