// Thin wrapper around the Telegram Bot HTTP API. Mirrors the defensive pattern
// used by lib/notifications/telegram.ts: missing token short-circuits with a
// log rather than throwing, and all network errors are swallowed so a bot
// send-failure never breaks the caller (webhook handler must always return 200).

interface SendMessageOptions {
  parse_mode?: 'MarkdownV2' | 'HTML'
  reply_markup?: unknown
  disable_web_page_preview?: boolean
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: SendMessageOptions,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.log('[bot] sendMessage skipped: no TELEGRAM_BOT_TOKEN')
    return
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
        ...options,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[bot] sendMessage failed:', res.status, body)
    }
  } catch (err) {
    console.error('[bot] sendMessage error:', err)
  }
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id, text }),
    })
  } catch (err) {
    console.error('[bot] answerCallbackQuery error:', err)
  }
}
