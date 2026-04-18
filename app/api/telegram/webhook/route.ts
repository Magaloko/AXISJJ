import { NextResponse, type NextRequest } from 'next/server'
import { dispatch, resetRegistry } from '@/lib/bot/router'
import { registerAllCommands } from '@/lib/bot/commands'
import type { TelegramUpdate } from '@/lib/bot/types'

// Ensure commands register exactly once per cold start.
let registered = false
function ensureRegistered() {
  if (registered) return
  resetRegistry()
  registerAllCommands()
  registered = true
}

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

  // 3. Ensure commands registered, dispatch (errors swallowed inside)
  ensureRegistered()
  await dispatch(update)

  // Always 200 — Telegram retries non-2xx forever, and duplicate dispatch
  // is harmless because update_ids are unique and handlers are idempotent.
  return NextResponse.json({ ok: true })
}

// Explicitly disable GET so Telegram's webhook-info probes don't succeed
// through the wrong path.
export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 })
}
