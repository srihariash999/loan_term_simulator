import type { EventType, TimelineEvent } from '../types'
import { format } from 'date-fns'
import { formatINR } from './calculations'
export const eventMeta: Record<EventType, { label: string; color: string }> = {
  'rate-change': { label: 'Interest rate', color: 'blue' }, 'emi-change': { label: 'EMI change', color: 'violet' }, prepayment: { label: 'Prepayment', color: 'emerald' }, 'bank-charge': { label: 'Bank charge', color: 'amber' }, 'insurance-charge': { label: 'Insurance', color: 'rose' }, 'top-up': { label: 'Loan top-up', color: 'cyan' }, 'principal-reduction': { label: 'Principal reduction', color: 'emerald' }
}
export const describeEvent = (event: TimelineEvent) => {
  if (event.type === 'rate-change') return `Interest changed to ${event.rate?.toFixed(2)}%`
  if (event.type === 'emi-change') return `EMI changed to ${formatINR(event.amount ?? 0, true)}`
  if (event.type === 'top-up') return `Top-up of ${formatINR(event.amount ?? 0, true)}`
  if (event.type === 'prepayment') return `Prepaid ${formatINR(event.amount ?? 0, true)}`
  return `${eventMeta[event.type].label}: ${formatINR(event.amount ?? 0, true)}`
}
export const eventDateLabel = (date: string) => format(new Date(date), 'MMM yyyy')
