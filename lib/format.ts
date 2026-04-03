// India-specific formatters and validators
import { formatInTimeZone } from 'date-fns-tz'

export const IST = 'Asia/Kolkata'

export function nowIST(): Date {
  return new Date()
}

export function todayIST(): string {
  return formatInTimeZone(new Date(), IST, 'yyyy-MM-dd')
}

export function formatTimeIST(date: string | Date): string {
  return formatInTimeZone(new Date(date), IST, 'h:mm a')
}

export function formatDateTimeIST(date: string | Date): string {
  return formatInTimeZone(new Date(date), IST, 'dd MMM yyyy, h:mm a')
}

export function formatDateIST(date: string | Date): string {
  return formatInTimeZone(new Date(date), IST, 'dd MMM yyyy')
}

// India-specific formatters and validators (original)

export function validateIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/[\s+\-()]/g, '').replace(/^91/, ''))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s+\-()]/g, '').replace(/^91/, '')
  if (cleaned.length !== 10) return phone
  return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}
