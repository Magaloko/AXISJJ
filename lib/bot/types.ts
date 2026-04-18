export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  first_name?: string
  username?: string
}

export interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  contact?: TelegramContact
  entities?: Array<{ type: string; offset: number; length: number }>
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export type BotRole = 'admin' | 'moderator' | 'coach' | 'member'
export type EffectiveRole = BotRole | 'unlinked'

export interface BotUserRow {
  chat_id: number
  profile_id: string
  bot_role: BotRole
  telegram_username: string | null
  first_name: string | null
  linked_at: string
}

export interface ProfileLite {
  id: string
  full_name: string
  email: string
  role: 'member' | 'coach' | 'owner'
  phone: string | null
  created_at: string
}

export interface BotContext {
  chatId: number
  telegramUserId: number
  telegramUsername: string | null
  firstName: string | null
  botUser: BotUserRow | null
  profile: ProfileLite | null
  role: EffectiveRole
}
