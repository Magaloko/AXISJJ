# Telegram Bot Expansion — Member Booking, Pushes, Staff Commands

**Date:** 2026-04-22
**Status:** Approved (user picked scope a + b + h on 2026-04-22)

## Problem

The Telegram bot today only handles identity (`/start`, `/help`, `/link`, `/me`, `/unlink`). Members have to open the web app for every action and every update; the bot is a dead-end after linking. Goal: bring member self-service and gym-staff push parity into Telegram so the website and the bot are two front ends over the same state.

## In Scope (user-picked on brainstorm)

**a — Member push notifications.** Booking confirmations, waitlist promotions, training reminders, session cancellations for booked members, belt promotions now push directly to the linked member's Telegram chat in addition to existing e-mail.

**b — Member-initiated actions.** `/buchen` lists the next 14 days of sessions with inline-keyboard "Book" buttons. `/meine` lists the member's own upcoming bookings with inline "Cancel" buttons. Calls the same Supabase pathways the website uses, so RLS and waitlist logic are honoured.

**h — Staff commands.** `/heute` (coach + owner) lists today's sessions with booking counts. `/fehlen` (coach + owner) lists members who booked an already-started session today but haven't checked in. `/broadcast <text>` (owner only) pushes a plain-text message to every linked member's chat.

## Explicitly Out of Scope

- WhatsApp integration (dropped by user).
- `/checkin`, `/turniere`, `/sprache`, `/streak`, `/leaderboard` — future PRs.
- Gamification pushes (xp events, quiz nudges).
- Bot-side edit flows beyond book / cancel.

## Architecture

```
           web app                         telegram
     ┌──────────────────┐           ┌──────────────────┐
     │ server actions   │           │  /api/telegram/  │
     │ (bookings, etc.) │           │    webhook       │
     └────────┬─────────┘           └────────┬─────────┘
              │                              │
              │  notify(event,               │ dispatch()
              │    targetProfileId?)         │
              ▼                              ▼
     ┌──────────────────────────────────────────────┐
     │         lib/notifications/index.ts           │
     │  admin telegram  +  email  +  member push    │
     └──────────┬───────────────────────────────────┘
                │
                ▼
     ┌──────────────────────────────────────────────┐
     │   lib/bot/member-notify.ts                   │
     │   resolveChatId(profileId) via bot_users     │
     │   sendMessage(chatId, text)                  │
     └──────────────────────────────────────────────┘
```

### New module: `lib/bot/member-notify.ts`

```
sendTelegramToMember(profileId: string, text: string): Promise<void>
```
Reads `bot_users.chat_id` via service-role client, no-op if member not linked, uses existing `lib/bot/telegram-api.ts` `sendMessage`. No Markdown — plain text by default, callers who want formatting pass their own escaped MarkdownV2.

### `notify()` extension

`notify(event, opts?)` — accepts optional `{ targetProfileId: string }`. When set and the event type is member-facing, fire an additional `sendTelegramToMember` in parallel with the existing admin-telegram + email fan-out. Message body reuses `formatted.telegramMarkdown`.

Wire-up points already in the codebase:
- `app/actions/bookings.ts` (`bookClass`, `cancelBooking`)
- `supabase/migrations/*promote_waitlist_rpc*` — server action that handles waitlist promotion already calls `notify({ type: 'waitlist.promoted' })` in `bookings.ts` on cancel; just pass the new profile id as target.
- `app/actions/sessions.ts` (`cancelSession`) — loop confirmed bookings, push to each.
- `app/actions/promotions.ts` (`promoteBelt`) — already emits `member.belt_promoted`; add targetProfileId.
- `lib/notifications/send-reminder.ts` (whichever cron sends `training.reminder`) — add targetProfileId per reminder.

### Inline keyboards via the existing router

No router changes. Callback buttons encode data as `"/book <sessionId>"` or `"/cancel <bookingId>"`. The router already routes `cbq.data` through `extractCommandName`, so a `/book` command handler sees the data via `update.callback_query.data` and parses the remainder itself.

### New commands

| Command | Roles | Data path |
|---|---|---|
| `/buchen` | member, coach, owner, admin, moderator | `class_sessions` JOIN `class_types` for next 14d where `cancelled=false`, exclude ones the user already booked, render up to 12 inline buttons labelled `"Di 18:00 · Fundamentals (4/12)"` |
| `/book <sessionId>` (callback) | member+ | Insert into `bookings` (confirmed if capacity, else waitlisted). Uses existing booking action so capacity/waitlist rules carry over. Reply `"✓ Gebucht"` or `"📋 Warteliste"` |
| `/meine` | member+ | Query member's own `bookings` where session `starts_at >= now`; render inline cancel buttons |
| `/cancel <bookingId>` (callback) | member+ | Verify booking.profile_id == ctx.profile.id, call cancel action, reply with confirmation |
| `/heute` | coach, owner, admin | Today's sessions `starts_at BETWEEN startOfDay AND endOfDay`, render `HH:MM · name · X/Y` |
| `/fehlen` | coach, owner, admin | Reuses the same logic as `getAdminDashboard.todayAttendance` — show first 10 missing members with class and start time |
| `/broadcast <text>` | owner only | Fetches every `bot_users.chat_id` where `profiles.role='member'`, sends the text to each. Rejects empty text. |

### Tests

Each new command handler gets a vitest unit test mirroring the pattern in `lib/bot/commands/__tests__/me.test.ts`: mock service-role client + `sendMessage`, assert the command reads the right tables and emits the right text. One test for `member-notify.sendTelegramToMember` covers the linked + unlinked paths.

## Risks / Notes

- **Service role for writes**: member bookings via bot use service-role client with an explicit `profile_id = ctx.profile.id` filter, bypassing RLS but maintaining authorization via the bot link. Every write must include that filter to prevent a bug from letting a bot user book for someone else.
- **Broadcast abuse**: `/broadcast` is owner-only, rate-limited to one call per 60 seconds via an in-memory guard, and logs the full text to `console.log` with caller profile id for audit.
- **Rate limits**: Telegram sendMessage is ~30 msgs/sec. `/broadcast` iterates sequentially with a 40 ms delay between sends.

## Verification

- `npx vitest run lib/bot/` — all new tests green.
- Local smoke: run bot with test `TELEGRAM_BOT_TOKEN`, link a test account, invoke `/buchen` → book → confirm e-mail still arrives and bot also replies.
- `/admin/dashboard` still works after notify() signature change (source-of-truth test).
