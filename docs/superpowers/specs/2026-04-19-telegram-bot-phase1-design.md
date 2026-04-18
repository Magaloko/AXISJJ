# AXISJJ Telegram Bot — Phase 1 (Foundation) Design Spec

**Date:** 2026-04-19
**Scope:** Bot infrastructure — webhook endpoint, command router with role guards, user linking flow, basic commands (`/start`, `/help`, `/link`, `/unlink`, `/me`). Builds on the existing `sendTelegram` notification outflow. Phases 2–5 (admin commands, member commands, gamification, education) build on this foundation.

---

## 1. Goals

Give gym roles a working Telegram bot they can bind to their account and query. At end of Phase 1, Magomed can `/start` the bot, link his account with a magic code from the website, and see `/me` confirm his role. The scaffolding is extensible — Phase 2 adds commands without touching webhook/router infrastructure.

---

## 2. Roles (bot-only — no profiles.role schema change)

`bot_users.bot_role` enum: `admin | moderator | coach | member`.

Derivation on link:
- `profile.role = 'owner'` → `bot_role = 'admin'`
- `profile.role = 'coach'` → `bot_role = 'coach'`
- `profile.role = 'member'` → `bot_role = 'member'`

`moderator` is not auto-derived. Admin (owner) assigns it manually via `/moderator add @username` (Phase 2). Until then, no moderator exists.

### Default command visibility

| Command | admin | moderator | coach | member | unlinked |
|---|---|---|---|---|---|
| `/start` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/help` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/link` (+ args) | — | — | — | — | ✓ |
| `/unlink` | ✓ | ✓ | ✓ | ✓ | — |
| `/me` | ✓ | ✓ | ✓ | ✓ | — |

Future phases extend the matrix but the routing machinery stays identical.

---

## 3. Database

### Migration `20260419_bot_users_and_link_codes.sql`

```sql
CREATE TABLE bot_users (
  chat_id            BIGINT PRIMARY KEY,
  profile_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bot_role           TEXT NOT NULL DEFAULT 'member'
                       CHECK (bot_role IN ('admin', 'moderator', 'coach', 'member')),
  telegram_username  TEXT,
  first_name         TEXT,
  linked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id)
);

CREATE INDEX idx_bot_users_profile_id ON bot_users(profile_id);

CREATE TABLE bot_link_codes (
  code              TEXT PRIMARY KEY,
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  used_at           TIMESTAMPTZ,
  used_by_chat_id   BIGINT
);

CREATE INDEX idx_bot_link_codes_profile_id ON bot_link_codes(profile_id);

ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_link_codes ENABLE ROW LEVEL SECURITY;

-- bot_users: owner of profile can read own entry; owner (gym) can read all.
CREATE POLICY "bot_users self-read"
  ON bot_users FOR SELECT
  USING (profile_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- All writes to bot_users happen through server actions / webhook handler
-- with the service-role key OR through authenticated users manipulating their own row.
CREATE POLICY "bot_users self-delete (unlink)"
  ON bot_users FOR DELETE
  USING (profile_id = auth.uid());

-- bot_link_codes: users read their own codes.
CREATE POLICY "bot_link_codes self-read"
  ON bot_link_codes FOR SELECT
  USING (profile_id = auth.uid());
```

**Singleton uniqueness:** `UNIQUE(profile_id)` guarantees one Telegram account per gym profile. Attempting to link a second Telegram to the same profile hits the UNIQUE violation — server action returns a friendly error ("Profil bereits verknüpft").

---

## 4. Code Structure

```
app/api/telegram/webhook/
└── route.ts                      ← POST endpoint: verify X-Telegram-Bot-Api-Secret-Token,
                                     parse Update, dispatch to router

lib/bot/
├── types.ts                      ← TelegramUpdate, Command, Context types
├── telegram-api.ts               ← sendMessage(chatId, text, options), answerCallbackQuery(...)
├── auth.ts                       ← resolveContext(chatId, fromUser) → { profile, botUser, role } | null
├── router.ts                     ← registerCommand(), dispatch(update, ctx)
├── escape.ts                     ← escapeMdV2 (re-export from notifications)
├── commands/
│   ├── start.ts
│   ├── help.ts
│   ├── link.ts                   ← handles both `/link CODE` and `/link` → request_contact
│   ├── unlink.ts
│   ├── me.ts
│   └── index.ts                  ← collects all commands into registry
└── __tests__/
    ├── auth.test.ts
    ├── router.test.ts
    ├── commands/*.test.ts

app/actions/bot-link.ts           ← generateLinkCode() — authed user generates their own
components/members/BotLinkCard.tsx ← UI on /konto: "Mit Telegram verknüpfen" button → modal

scripts/setup-telegram-webhook.ts ← one-time CLI: calls setWebhook on Bot API

supabase/migrations/20260419_bot_users_and_link_codes.sql
```

---

## 5. Webhook Endpoint

`app/api/telegram/webhook/route.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { dispatch } from '@/lib/bot/router'
import type { TelegramUpdate } from '@/lib/bot/types'

export async function POST(req: NextRequest) {
  // 1. Verify secret token header
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const headerSecret = req.headers.get('x-telegram-bot-api-secret-token')
  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // 2. Parse update
  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // 3. Dispatch (errors are swallowed inside dispatch to always return 200 to Telegram)
  await dispatch(update)
  return NextResponse.json({ ok: true })
}
```

Telegram retries webhooks on non-2xx responses. We ALWAYS return 200 after handling, even if a command errored — the error goes to `console.error` for Vercel logs. Duplicate dispatch is idempotent (update ids are unique; Telegram handles dedup via `update_id`).

---

## 6. Auth Resolution (`lib/bot/auth.ts`)

```typescript
export interface BotContext {
  chatId: number
  telegramUserId: number
  telegramUsername: string | null
  firstName: string | null
  // If linked:
  botUser: BotUser | null
  profile: Profile | null
  role: 'admin' | 'moderator' | 'coach' | 'member' | 'unlinked'
}

export async function resolveContext(
  chatId: number,
  from: { id: number; username?: string; first_name?: string }
): Promise<BotContext>
```

Steps:
1. Query `bot_users` where `chat_id = $1` (using service-role client — webhook runs server-side)
2. If not found → role = `'unlinked'`, botUser/profile = null
3. If found → join to `profiles` for name/role/belt info, compute `role` from `bot_user.bot_role`

The webhook endpoint uses the Supabase **service role key** (`SUPABASE_SERVICE_ROLE_KEY`, already in env for other admin operations) to bypass RLS — no way to run as an authenticated user during a webhook.

---

## 7. Router (`lib/bot/router.ts`)

```typescript
interface Command {
  name: string                                      // "start", "link" (no slash)
  allowedRoles: BotContext['role'][]                // [] means all roles including 'unlinked'
  handler: (ctx: BotContext, update: TelegramUpdate) => Promise<void>
}

const REGISTRY: Map<string, Command>

export function registerCommand(cmd: Command): void
export async function dispatch(update: TelegramUpdate): Promise<void>
```

`dispatch()`:
1. Extract `message` or `callback_query` from update
2. Derive `chatId`, `from` → call `resolveContext()` → `ctx`
3. Extract command name from `message.text` if starts with `/` (strip `@AXISJJ_Bot` suffix), or from `callback_query.data`
4. If it's a `message.contact` event (user shared phone via request_contact button) → dispatch to `link` command with contact payload
5. Look up command in registry
6. If command not found → send "Unbekannter Befehl. Nutze /help" (localized)
7. Check `allowedRoles`: if `ctx.role` not in list AND list is not empty → send "Du hast keinen Zugriff auf diesen Befehl"
8. Invoke `command.handler(ctx, update)` wrapped in try/catch → errors logged to `console.error`

Commands register themselves in `lib/bot/commands/index.ts` which is imported at module load.

---

## 8. Commands (Phase 1)

### `/start` (all roles, including unlinked)

```
🥋 Willkommen bei AXIS Jiu-Jitsu!

Ich bin der offizielle Bot. Hier kannst du dein Training verwalten und alles rund ums Gym erfahren.

Zum Start: verknüpfe deinen Account mit deinem Gym-Profil:
• /link mit Magic-Code von der Website
• oder /link und dann deine Telefonnummer teilen

Mit /help siehst du alle verfügbaren Befehle.
```

### `/help` (all roles)

Lists commands visible to the user's current role. For unlinked: only `/start`, `/help`, `/link`. For linked: above + `/me`, `/unlink`. (Phase 2+ commands added to their role list as they ship.)

Output format:
```
📖 Verfügbare Befehle (Rolle: Mitglied)

/me — Deine Profil-Info
/unlink — Verknüpfung lösen
/help — Diese Hilfe

Mehr Befehle kommen bald!
```

### `/link` (unlinked only)

Two modes:

**Mode A — Magic code:** `/link 7AB3X9`
- Query `bot_link_codes` where `code = $1 AND used_at IS NULL AND expires_at > NOW()`
- If match: insert into `bot_users` (chat_id, profile_id, bot_role derived from profile.role, telegram_username, first_name), update `bot_link_codes.used_at` and `used_by_chat_id`
- If no match: "❌ Code ungültig oder abgelaufen. Neuen Code auf /konto anfordern."
- If already linked (UNIQUE violation on profile_id): "❌ Dieses Profil ist bereits mit einem anderen Telegram verknüpft. Dort zuerst /unlink senden."

**Mode B — Phone:** `/link` (no args)
- Bot responds: "📱 Bitte teile deine Telefonnummer:" with reply_markup containing a `KeyboardButton { text: "Nummer teilen", request_contact: true }`
- When user taps → Telegram sends a `message.contact` → router dispatches to `link` with contact payload
- Normalize phone (strip spaces, pluses) and match against normalized `profiles.phone`
- If exactly 1 match and not already linked → insert bot_users, send "✅ Verknüpft als {full_name}!"
- If 0 matches → "❌ Keine Telefonnummer gefunden. Bitte trage sie auf /konto ein oder nutze einen Link-Code."
- If 2+ matches → "❌ Mehrere Profile mit dieser Nummer gefunden. Bitte nutze einen Link-Code von /konto."
- If contact.user_id ≠ from.id (user shared someone else's contact) → reject

After any successful link → send a role-specific welcome: "👑 Als Admin kannst du … (Phase 2 coming)."

### `/unlink` (linked only)

- Delete bot_users row where chat_id = $1
- Respond: "✅ Verknüpfung entfernt. Deine Chat-History bleibt hier, aber der Bot kennt dein Profil nicht mehr."

### `/me` (linked only)

- Format:
  ```
  👤 Deine Daten
  
  Name:   {full_name}
  Rolle:  {friendly_role_de}
  E-Mail: {email}
  Gürtel: {current_belt} ({stripes} Streifen)
  Mitglied seit: {created_at_de}
  
  Telegram: @{telegram_username}
  Verknüpft seit: {linked_at_de}
  ```
- `friendly_role_de`: admin → "Admin · Owner", moderator → "Moderator", coach → "Trainer", member → "Mitglied"

### Command routing corner cases
- `/start@AXISJJ_Bot` — strip the `@botname` suffix before lookup
- Uppercase `/LINK`: lowercase before lookup
- Commands with @mentions or formatting: use only the first word as command name

---

## 9. Magic Code Generation (`app/actions/bot-link.ts`)

```typescript
'use server'

export async function generateBotLinkCode(): Promise<{ code?: string; error?: string }>
```

- Requires authenticated user
- Generates 6 random uppercase alphanumeric chars (excluding ambiguous `0/O/1/I/L`) → "7AB3X9"
- Inserts into `bot_link_codes` with profile_id = auth.uid(), expires_at = NOW()+15min
- Returns the code to the client
- If user already has an unused active code, returns that one (no spam)
- If user's profile already has an active bot_users link, returns error: "Bereits verknüpft. Zuerst auf Telegram /unlink senden."

Rate limit: max 5 code generations per profile per hour (enforced by a `COUNT(*) WHERE created_at > NOW() - INTERVAL '1 hour'` check).

---

## 10. `BotLinkCard` Component on `/konto`

```tsx
<BotLinkCard linkedChatId={botUser?.chat_id ?? null} telegramUsername={botUser?.telegram_username ?? null} />
```

- **If already linked:** Shows "✅ Verknüpft mit Telegram @username" + "Verbindung lösen"-Button (calls server action to delete bot_users row for current user).
- **If not linked:** Shows "🔗 Mit Telegram verknüpfen"-Button → on click calls `generateBotLinkCode()` → shows code in a prominent box + instructions: "Öffne @AXISJJ_Bot und sende: `/link <code>`"
- Also offers a deep link: `https://t.me/AXISJJ_Bot?start=link_<code>` — tapping opens the bot pre-filled with a command. (Telegram supports `start` parameter which becomes a `/start <payload>` — the bot's start command detects the `link_` prefix and auto-links.)

**Deep-link flow:** `/start link_7AB3X9` → start.ts detects `link_` prefix → dispatches internally to link.ts with the extracted code → auto-links without manual typing. Mobile-friendly UX.

---

## 11. `scripts/setup-telegram-webhook.ts`

One-time script to register the webhook with Telegram. Run after first deployment.

```typescript
#!/usr/bin/env tsx
import 'dotenv/config'

const token = process.env.TELEGRAM_BOT_TOKEN
const baseUrl = process.env.NEXT_PUBLIC_APP_URL  // https://axisjj.vercel.app
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token || !baseUrl || !secret) {
  console.error('Missing TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_APP_URL, or TELEGRAM_WEBHOOK_SECRET')
  process.exit(1)
}

const webhookUrl = `${baseUrl}/api/telegram/webhook`
const res = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook?` +
    new URLSearchParams({ url: webhookUrl, secret_token: secret, drop_pending_updates: 'true' })
)
const json = await res.json()
console.log(JSON.stringify(json, null, 2))
```

Invoked: `npx tsx scripts/setup-telegram-webhook.ts`

---

## 12. Environment Variables

New:
- `TELEGRAM_WEBHOOK_SECRET` — random 32+ char string. Generate with `openssl rand -hex 32` or Vercel's secret generator.
- `NEXT_PUBLIC_APP_URL` — `https://axisjj.vercel.app` (needed for setup script)
- `SUPABASE_SERVICE_ROLE_KEY` — already exists (verify)

Existing (unchanged): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (the latter is for outbound notifications to Magomed only; unrelated to this phase).

---

## 13. Testing

### Unit tests
- `auth.test.ts`: resolveContext with unlinked chat, linked member, linked coach, linked owner (→ admin)
- `router.test.ts`: dispatch picks correct command; rejects unauthorized roles; handles unknown commands
- `commands/link.test.ts`: magic-code happy path, expired code, used code, wrong code, already-linked-profile error
- `commands/link-phone.test.ts`: phone-match success, no match, multiple matches, shared-wrong-contact rejection
- `commands/start.test.ts`: renders welcome; with `link_XXX` deep-link auto-links
- `commands/me.test.ts`: formatted output for each role
- `bot-link.test.ts`: generateBotLinkCode produces 6-char alphanum, hits rate limit, reuses unexpired code

### Integration-ish
- `webhook.test.ts`: POST with wrong secret → 403, valid → 200, invalid JSON → 400

No end-to-end test with the live Bot API (mocked).

---

## 14. Operator Setup (post-merge)

1. Generate webhook secret: `openssl rand -hex 32` (or use any password manager)
2. Vercel env vars (Production + Preview + Development):
   - `TELEGRAM_WEBHOOK_SECRET=<the secret>`
   - `NEXT_PUBLIC_APP_URL=https://axisjj.vercel.app`
3. Apply DB migration: open Supabase SQL editor, paste contents of the migration file, run
4. Redeploy
5. Run: `npx tsx scripts/setup-telegram-webhook.ts` (locally with same env vars) — registers webhook
6. Test: send `/start` to @AXISJJ_Bot → bot responds

---

## 15. Out of Scope (later phases)

- All Phase 2 commands (admin `/stats`, `/leads`, `/promote`, `/broadcast`, `/moderator add`)
- All Phase 3 commands (member `/schedule`, `/book`, `/cancel`, `/belt`, `/qr`)
- Gamification (XP, streaks, leaderboard, badges)
- Quiz/education engine
- Inline query support (@AXISJJ_Bot in other chats)
- Voice / photo / video handling
- Localization to English (Phase 1 is DE only)
- Bot command auto-registration with `setMyCommands` (can be part of setup script in Phase 2)
