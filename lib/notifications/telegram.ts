import type { FormattedNotification } from './events'

/**
 * Strip MarkdownV2 formatting escape characters to produce a best-effort
 * plain-text fallback. Removes the `\` that precedes reserved chars and the
 * `*` bold markers, so the message reads naturally.
 */
function stripMarkdownV2(md: string): string {
  return md
    // Unescape escaped reserved chars: \X → X
    .replace(/\\([_*[\]()~`>#+\-=|{}.!])/g, '$1')
    // Drop bold markers
    .replace(/\*/g, '')
}

async function postTelegram(
  token: string,
  chatId: string,
  text: string,
  parseMode?: 'MarkdownV2',
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parseMode ? { parse_mode: parseMode } : {}),
      disable_web_page_preview: true,
    }),
  })
  const body = await res.text()
  return { ok: res.ok, status: res.status, body }
}

export async function sendTelegram(formatted: FormattedNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.log('[notifications] telegram skipped: missing env vars')
    return
  }
  try {
    // First attempt: send with MarkdownV2 formatting.
    const first = await postTelegram(token, chatId, formatted.telegramMarkdown, 'MarkdownV2')
    if (first.ok) return

    console.error('[notifications] telegram MdV2 failed:', first.status, first.body)

    // Fallback: send the same content as plain text (no parse_mode) so a
    // formatting/escape bug doesn't silently swallow the notification.
    const plain = stripMarkdownV2(formatted.telegramMarkdown)
    const second = await postTelegram(token, chatId, plain)
    if (!second.ok) {
      console.error('[notifications] telegram plain fallback also failed:', second.status, second.body)
    }
  } catch (err) {
    console.error('[notifications] telegram error:', err)
  }
}
