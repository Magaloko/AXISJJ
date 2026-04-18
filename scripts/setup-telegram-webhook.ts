#!/usr/bin/env tsx
/**
 * One-time / one-per-env script that registers the AXIS Telegram bot's
 * webhook URL with Telegram's Bot API.
 *
 * Required env vars (read from .env.local or process env):
 *   TELEGRAM_BOT_TOKEN        - bot token from BotFather
 *   NEXT_PUBLIC_APP_URL       - https://axisjj.vercel.app (or preview URL)
 *   TELEGRAM_WEBHOOK_SECRET   - random 32-char secret shared with the endpoint
 *
 * Usage:
 *   npx tsx scripts/setup-telegram-webhook.ts
 *   npx tsx scripts/setup-telegram-webhook.ts --info    # query current webhook
 *   npx tsx scripts/setup-telegram-webhook.ts --delete  # unset webhook
 */

import 'dotenv/config'

const MODE =
  process.argv.includes('--info') ? 'info' :
  process.argv.includes('--delete') ? 'delete' : 'set'

const token = process.env.TELEGRAM_BOT_TOKEN
const baseUrl = process.env.NEXT_PUBLIC_APP_URL
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN')
  process.exit(1)
}

async function main() {
  if (MODE === 'info') {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
    return
  }

  if (MODE === 'delete') {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`)
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
    return
  }

  if (!baseUrl) {
    console.error('Missing NEXT_PUBLIC_APP_URL')
    process.exit(1)
  }
  if (!secret) {
    console.error('Missing TELEGRAM_WEBHOOK_SECRET')
    process.exit(1)
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`
  const params = new URLSearchParams({
    url: webhookUrl,
    secret_token: secret,
    drop_pending_updates: 'true',
    max_connections: '40',
    allowed_updates: JSON.stringify(['message', 'callback_query']),
  })

  console.log(`Setting webhook → ${webhookUrl}`)
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?${params}`)
  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))

  if (!res.ok || !json.ok) {
    process.exit(1)
  }

  console.log('\nVerifying with getWebhookInfo...')
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  console.log(JSON.stringify(await info.json(), null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
