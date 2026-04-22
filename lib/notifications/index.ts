import type { NotificationEvent } from './events'
import { formatEvent } from './events'
import { sendEmail } from './email'
import { sendTelegram } from './telegram'
import { sendTelegramToMember } from '@/lib/bot/member-notify'

export type { NotificationEvent } from './events'

export interface NotifyOptions {
  /**
   * If set, also push the Telegram-formatted message to this member's linked
   * bot chat (best-effort; no-op if they haven't linked). Fires in parallel
   * with the existing admin Telegram + email fan-out.
   */
  targetProfileId?: string
}

export async function notify(
  event: NotificationEvent,
  options?: NotifyOptions,
): Promise<void> {
  const formatted = formatEvent(event)
  const tasks: Promise<unknown>[] = [sendEmail(formatted), sendTelegram(formatted)]
  if (options?.targetProfileId) {
    tasks.push(
      sendTelegramToMember(options.targetProfileId, formatted.telegramMarkdown, {
        parseMode: 'MarkdownV2',
      }),
    )
  }
  await Promise.allSettled(tasks)
}
