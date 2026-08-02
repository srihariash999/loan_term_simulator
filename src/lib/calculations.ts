import { differenceInCalendarDays, getDaysInYear, max, min } from 'date-fns'

export const roundMoney = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
export const formatINR = (value: number, compact = false) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: compact ? 0 : 2, notation: compact ? 'compact' : 'standard' }).format(value)
export const calculateEmi = (principal: number, rate: number, months: number) => {
  const r = rate / 1200
  if (!r) return roundMoney(principal / Math.max(months, 1))
  return roundMoney(principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1))
}
export const dailyInterest = (principal: number, rate: number, from: Date, to: Date) => roundMoney(principal * (rate / 100) * differenceInCalendarDays(to, from) / getDaysInYear(from))
export const daysBetween = (from: Date, to: Date) => Math.max(0, differenceInCalendarDays(min([from, to]), max([from, to])))
