import type { FormattedNotification } from './events'

export async function sendTelegram(formatted: FormattedNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.log('[notifications] telegram skipped: missing env vars')
    return
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatted.telegramMarkdown,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[notifications] telegram HTTP error:', res.status, body)
    }
  } catch (err) {
    console.error('[notifications] telegram error:', err)
  }
}
