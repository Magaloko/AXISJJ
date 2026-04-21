// lib/i18n/index.ts
import { de } from './de'
import { en } from './en'
import { ru } from './ru'

export type Lang = 'de' | 'en' | 'ru'
export const translations = { de, en, ru }

export const LANG_META: Record<Lang, { label: string; flag: string; nativeName: string }> = {
  de: { label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  en: { label: 'English', flag: '🇬🇧', nativeName: 'English' },
  ru: { label: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
}
