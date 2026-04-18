import type { NotificationEvent } from './events'
import { formatEvent } from './events'
import { sendEmail } from './email'
import { sendTelegram } from './telegram'

export type { NotificationEvent } from './events'

export async function notify(event: NotificationEvent): Promise<void> {
  const formatted = formatEvent(event)
  await Promise.allSettled([sendEmail(formatted), sendTelegram(formatted)])
}
