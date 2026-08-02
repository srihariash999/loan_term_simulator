import { addDays, addMonths, endOfMonth, format, isBefore, startOfDay } from 'date-fns'
import type { Loan, ScheduleRow, Simulation, TimelineEvent } from '../types'
import { calculateEmi, dailyInterest, roundMoney } from './calculations'

/** Pure daily-accrual, monthly-payment engine. Events are settled on their exact effective dates. */
export function simulateLoan(loan: Loan, events: TimelineEvent[] = []): Simulation {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  // Native parsing of YYYY-MM-DD is UTC; force local midnight so an event never
  // accidentally moves to the prior accounting day in IST or other time zones.
  const localDate = (date: string) => startOfDay(new Date(`${date.slice(0, 10)}T00:00:00`))
  let balance = loan.amount, rate = loan.initialRate, emi = loan.actualEmi || loan.scheduledEmi || calculateEmi(loan.amount, loan.initialRate, loan.tenureMonths)
  let cursor = startOfDay(new Date(loan.startDate)), monthlyPaymentDate = endOfMonth(cursor), targetEnd = addMonths(cursor, loan.tenureMonths)
  let eventIndex = 0, month = 0, totalInterest = 0, totalPrincipal = 0, totalExtra = 0
  const rows: ScheduleRow[] = []
  while (balance > 0.005 && month < 1200) {
    month++
    const rowStart = cursor, opening = balance, ids: string[] = []
    let interest = 0, extra = 0, principal = 0
    const periodEnd = addDays(monthlyPaymentDate, 1) // accrue through payment-day inclusive
    while (eventIndex < sorted.length && isBefore(localDate(sorted[eventIndex].date), rowStart)) eventIndex++
    let segmentStart = rowStart
    while (eventIndex < sorted.length && isBefore(localDate(sorted[eventIndex].date), periodEnd)) {
      const ev = sorted[eventIndex], evDate = localDate(ev.date)
      if (isBefore(evDate, segmentStart)) { eventIndex++; continue }
      interest += dailyInterest(balance, rate, segmentStart, evDate)
      segmentStart = evDate; ids.push(ev.id)
      if (ev.type === 'rate-change' && ev.rate != null) rate = ev.rate
      if (ev.type === 'emi-change' && ev.amount != null) emi = ev.amount
      if ((ev.type === 'prepayment' || ev.type === 'principal-reduction') && ev.amount) {
        const paid = Math.min(balance, ev.amount); balance -= paid; extra += paid; principal += paid
        if (ev.type === 'prepayment' && ev.strategy === 'reduce-emi') {
          const remaining = Math.max(1, Math.round((targetEnd.getTime() - evDate.getTime()) / 86400000 / 30.44))
          emi = calculateEmi(balance, rate, remaining)
        }
      }
      if (ev.type === 'top-up' && ev.amount) balance += ev.amount
      eventIndex++
    }
    interest += dailyInterest(balance, rate, segmentStart, periodEnd)
    const scheduled = Math.min(emi, balance + interest)
    const scheduledPrincipal = Math.max(0, scheduled - interest)
    balance = Math.max(0, balance - scheduledPrincipal); principal += scheduledPrincipal
    totalInterest += interest; totalPrincipal += principal; totalExtra += extra
    rows.push({ month, date: format(monthlyPaymentDate, 'yyyy-MM-dd'), openingBalance: roundMoney(opening), interest: roundMoney(interest), principal: roundMoney(principal), emi: roundMoney(scheduled), extraPayment: roundMoney(extra), closingBalance: roundMoney(balance), interestRate: rate, eventIds: ids })
    cursor = new Date(periodEnd); cursor.setDate(cursor.getDate() + 1); monthlyPaymentDate = endOfMonth(cursor)
    if (cursor > addMonths(targetEnd, 100 * 12)) break
  }
  return { rows, totalInterest: roundMoney(totalInterest), totalPrincipal: roundMoney(totalPrincipal), totalExtra: roundMoney(totalExtra), closureDate: rows.at(-1)?.date, initialEmi: loan.scheduledEmi, currentRate: rows.at(-1)?.interestRate ?? rate, isClosed: balance <= .005 }
}
