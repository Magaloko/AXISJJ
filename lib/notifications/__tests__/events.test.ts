import { describe, it, expect } from 'vitest'
import { escapeMdV2, formatEvent } from '../events'

describe('escapeMdV2', () => {
  it('escapes all reserved MarkdownV2 characters', () => {
    const input = '_*[]()~`>#+-=|{}.!'
    const out = escapeMdV2(input)
    for (const ch of input) {
      expect(out).toContain('\\' + ch)
    }
  })

  it('leaves normal text alone', () => {
    expect(escapeMdV2('Hello World 123')).toBe('Hello World 123')
  })

  it('escapes mixed content', () => {
    expect(escapeMdV2('user@example.com')).toBe('user@example\\.com')
  })
})

describe('formatEvent - lead.created', () => {
  it('produces expected subject, text, and telegram content', () => {
    const out = formatEvent({
      type: 'lead.created',
      data: {
        full_name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+43 123',
        message: 'Interesse am Probetraining',
        source: 'instagram',
      },
    })
    expect(out.emailSubject).toMatch(/^\[AXIS\] Neuer Lead:/)
    expect(out.emailSubject).toContain('Max Mustermann')
    expect(out.emailText).toContain('max@example.com')
    expect(out.emailText).toContain('Max Mustermann')
    expect(out.emailHtml).toContain('<strong>')
    expect(out.emailHtml).toContain('Max Mustermann')
    expect(out.telegramMarkdown).toContain('Neuer Lead')
    expect(out.telegramMarkdown).toContain('Max Mustermann')
  })
})

describe('formatEvent - lead.status_changed', () => {
  it('mentions old and new status', () => {
    const out = formatEvent({
      type: 'lead.status_changed',
      data: { full_name: 'Jane', email: 'j@x.com', oldStatus: 'new', newStatus: 'contacted' },
    })
    expect(out.emailText).toContain('new')
    expect(out.emailText).toContain('contacted')
    expect(out.telegramMarkdown).toContain('new')
    expect(out.telegramMarkdown).toContain('contacted')
  })
})

describe('formatEvent - user.registered', () => {
  it('has subject containing Neue Registrierung', () => {
    const out = formatEvent({
      type: 'user.registered',
      data: { full_name: 'Ali', email: 'ali@x.com' },
    })
    expect(out.emailSubject).toContain('Neue Registrierung')
  })
})

describe('formatEvent - booking.created', () => {
  it('contains className and waitlisted label', () => {
    const out = formatEvent({
      type: 'booking.created',
      data: {
        memberName: 'Bob',
        className: 'BJJ Advanced',
        startsAt: '2026-04-20T18:00:00.000Z',
        status: 'waitlisted',
      },
    })
    expect(out.emailText).toContain('BJJ Advanced')
    expect(out.emailText.toLowerCase()).toContain('waitlisted')
  })
})

describe('formatEvent - checkin.recorded', () => {
  it('has Check-in title in telegram', () => {
    const out = formatEvent({
      type: 'checkin.recorded',
      data: { memberName: 'Bob', className: 'BJJ', startsAt: '2026-04-20T18:00:00.000Z' },
    })
    expect(out.telegramMarkdown).toContain('Check\\-in')
  })
})

describe('formatEvent - belt.promoted', () => {
  it('mentions both from and to belts', () => {
    const out = formatEvent({
      type: 'belt.promoted',
      data: { memberName: 'Alice', fromBelt: 'white', toBelt: 'blue' },
    })
    expect(out.emailText).toContain('white')
    expect(out.emailText).toContain('blue')
    expect(out.telegramMarkdown).toContain('white')
    expect(out.telegramMarkdown).toContain('blue')
  })
})

describe('formatEvent - gym.info_updated', () => {
  it('has minimal body with fixed subject', () => {
    const out = formatEvent({ type: 'gym.info_updated', data: {} })
    expect(out.emailSubject).toBe('[AXIS] Gym-Info aktualisiert')
    expect(out.emailText).toContain('Zeit:')
  })
})
