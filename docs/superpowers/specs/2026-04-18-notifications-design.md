# AXISJJ Notifications — Design Spec

**Date:** 2026-04-18
**Scope:** Email + Telegram notifications to the owner (Magomed) on every meaningful event — lead creation, member registration/login, bookings, check-ins, belt promotions, admin mutations, gym-settings changes.

---

## 1. Goals

Give the owner real-time awareness of everything happening on the platform via two channels: Gmail (archive-friendly, searchable) and Telegram (instant, mobile push). Fire-and-forget — user-facing actions never block on notifications.

---

## 2. Architecture

```
lib/notifications/
├── index.ts        ← notify(event) — public entry point, fans out to both adapters
├── email.ts        ← sendEmail() via Nodemailer + Gmail SMTP :587 STARTTLS
├── telegram.ts     ← sendTelegram() via fetch to Bot API
├── events.ts       ← NotificationEvent discriminated-union + formatEvent()
└── __tests__/
    ├── events.test.ts
    ├── index.test.ts
    ├── email.test.ts
    └── telegram.test.ts
```

### Invocation pattern

```ts
import { waitUntil } from '@vercel/functions'
import { notify } from '@/lib/notifications'

// in each server action, after success:
waitUntil(notify({ type: 'lead.created', data: { full_name, email, source } }))
return { success: true }
```

`waitUntil` is Vercel's Fluid-Compute primitive for deferring work past the user response without killing the execution context.

### Error handling

- `notify()` never throws. Errors from either adapter are caught and logged via `console.error`.
- Missing env vars → adapter is a no-op (useful for local dev and CI).
- Adapter errors don't cross-pollute: if Telegram is down, email still sends (and vice versa).

---

## 3. Environment Variables

```
GMAIL_USER=Magomed.dadakaev@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx     # generated at myaccount.google.com/apppasswords
NOTIFICATION_RECIPIENT=Magomed.dadakaev@gmail.com
TELEGRAM_BOT_TOKEN=<rotated token from BotFather>
TELEGRAM_CHAT_ID=<numeric chat id from getUpdates>
```

All secrets set in Vercel (Production + Preview) via Dashboard → Settings → Environment Variables. Never committed. `.env.local` for dev.

---

## 4. Event Catalog

Events are a discriminated union. Every server action mutation (and the auth callback for user events) emits one.

```ts
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
  | { type: 'gym.info_updated'; data: {} }
  | { type: 'gym.hours_updated'; data: {} }
  | { type: 'gym.policies_updated'; data: {} }
```

### Format helper

`formatEvent(event)` returns:

```ts
interface FormattedNotification {
  emailSubject: string           // "[AXIS] Neuer Lead: Max Mustermann"
  emailText: string              // plain-text body for email
  emailHtml: string              // basic HTML body (same info, styled minimally)
  telegramMarkdown: string       // Telegram MarkdownV2 escaped body with emoji prefix
}
```

Emoji prefixes for Telegram: 🆕 lead · 🔄 status_changed · 👤 user · 📅 booking · ✅ checkin · 🥋 belt · ⚙️ admin · 🏢 gym.

Example email for `lead.created`:
```
Subject: [AXIS] Neuer Lead: Max Mustermann

Neuer Lead eingegangen
──────────────────────
Name:      Max Mustermann
E-Mail:    max@example.com
Quelle:    Instagram
Nachricht: Interesse am Probetraining

Zeit: 19. Apr 2026, 14:23 CEST
```

Example Telegram for same:
```
🆕 *Neuer Lead*
*Name:* Max Mustermann
*E-Mail:* max@example.com
*Quelle:* Instagram
*Nachricht:* Interesse am Probetraining
```

---

## 5. Integration Points

Every existing server action + auth flow gets a `waitUntil(notify(...))` call immediately before returning success.

| File | Action | Event emitted |
|---|---|---|
| `app/actions/leads.ts` | `submitTrialLead` (public form) | `lead.created` |
| `app/actions/leads.ts` | `createLead` (admin) | `lead.created` |
| `app/actions/leads.ts` | `updateLeadStatus` | `lead.status_changed` |
| `app/auth/callback/route.ts` | first-time login | `user.registered` |
| `app/auth/callback/route.ts` | subsequent logins | `user.login` |
| `app/login/page.tsx` | password login success | `user.login` (via a dedicated `/api/notify-login` or simpler: don't notify here — magic-link covers most cases, password login fires via an additional client→server call) |
| `app/actions/bookings.ts` | `createBooking` | `booking.created` |
| `app/actions/bookings.ts` | `cancelBooking` | `booking.cancelled` |
| `app/actions/checkin.ts` | `checkIn` | `checkin.recorded` |
| `app/actions/sessions.ts` | `upsertSession` (INSERT) | `session.created` |
| `app/actions/sessions.ts` | `upsertSession` (UPDATE) | `session.updated` |
| `app/actions/sessions.ts` | `cancelSession` | `session.cancelled` |
| `app/actions/promotions.ts` | `promoteToNextBelt` | `belt.promoted` |
| `app/actions/members.ts` | `updateMember` | `member.updated` |
| `app/actions/members.ts` | `updateMemberRole` | `member.role_changed` |
| `app/actions/class-types.ts` | `upsertClassType` | `classtype.upserted` |
| `app/actions/class-types.ts` | `deleteClassType` | `classtype.deleted` |
| `app/actions/gym-settings.ts` | `updateGymInfo` | `gym.info_updated` |
| `app/actions/gym-settings.ts` | `updateOpeningHours` | `gym.hours_updated` |
| `app/actions/gym-settings.ts` | `updatePolicies` | `gym.policies_updated` |

**Login notification strategy:** simplest approach is to fire the `user.login` event from the **auth callback route** only (covers magic-link + OAuth). For password login via client-side `signInWithPassword`, add a small server action `logLoginEvent()` called from `login/page.tsx` after success. That keeps the "login" event centralized and server-side.

**First-time vs returning user:** in the auth callback, fetch `profiles` for the user id. If the profile was just inserted (e.g., created less than 5 seconds ago based on `created_at`), emit `user.registered`. Otherwise emit `user.login`.

---

## 6. Dependencies

```json
"dependencies": {
  "nodemailer": "^6.9.x",
  "@vercel/functions": "^1.x"
}
"devDependencies": {
  "@types/nodemailer": "^6.x"
}
```

---

## 7. Testing

### Unit tests

- **`events.test.ts`** — for each of the ~18 event types: `formatEvent()` produces expected subject, text, html, telegramMarkdown. Snapshot-ish assertions on key substrings (member name, email, timestamps).
- **`email.test.ts`** — `sendEmail()` calls `nodemailer.createTransport().sendMail` with correct shape. Env-var missing → returns without calling. SMTP error → logged, not thrown.
- **`telegram.test.ts`** — `sendTelegram()` calls `fetch` with correct URL and body. Env-var missing → returns without calling. HTTP error → logged, not thrown. Uses `vi.fn()` for `fetch`.
- **`index.test.ts`** — `notify()` calls both adapters. One failure doesn't block the other.

No e2e tests (would require live Gmail/Telegram).

### Integration tests

Each server action that adopts `waitUntil(notify(...))` gets an additional test assertion that `notify` was called with the correct event shape (using `vi.mock('@/lib/notifications')`).

---

## 8. Rollout

1. Feature branch `feature/notifications` off `main`
2. Plan decomposes into ~6 tasks: (1) dependencies + skeleton, (2) events catalog, (3) email adapter, (4) telegram adapter, (5) notify + tests, (6) hook into all server actions + auth callback
3. Final PR once tests pass. Operator sets env vars in Vercel before first deployment — notifications no-op gracefully if vars missing.

---

## 9. Security

- **Secrets only in Vercel env + local `.env.local`** — never in git, never in chat
- **`.env.local` already in `.gitignore`** — verify before first commit
- **No user input in notification payloads is rendered as HTML without escape** — email HTML uses basic template with text escaping; Telegram MarkdownV2 escapes reserved characters (`_`, `*`, `[`, `]`, `(`, `)`, `~`, `` ` ``, `>`, `#`, `+`, `-`, `=`, `|`, `{`, `}`, `.`, `!`)
- **Gmail rate limits:** ~500 messages/day for free accounts. With "D = everything" scope and typical gym traffic (<100 events/day), well under limit.

---

## 10. Out of Scope (Phase 2)

- Admin UI to toggle per-event-type notifications on/off
- Persistent notification log in DB (for audit / debug)
- Multiple recipients (second coach, third party)
- Digest mode (daily summary instead of real-time)
- Notifications to members themselves (booking confirmations, promotion congrats)
- Retry logic on transient failures (acceptable loss given `waitUntil`)
- Slack / Discord / SMS adapters
- Transactional email templates with branding/logo
