const KIGALI_TZ = 'Africa/Kigali'

export function formatOrderDate(utcDate: string | Date): string {
  return new Intl.DateTimeFormat('en-RW', {
    timeZone: KIGALI_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utcDate))
}

export function formatShortDate(utcDate: string | Date): string {
  return new Intl.DateTimeFormat('en-RW', {
    timeZone: KIGALI_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(utcDate))
}

export function toISOStringKigali(date: Date): string {
  return date.toISOString()
}
