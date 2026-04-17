import { format, addDays, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'HH:mm')
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE, d. MMMM', { locale: de })
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'EEE d.M.', { locale: de })
}

export function getNextSevenDays(): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i))
}

export function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Heute'
  if (isTomorrow(date)) return 'Morgen'
  return format(date, 'EEEE', { locale: de })
}

export { startOfDay, endOfDay, addDays }
