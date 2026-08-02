import { describe, expect, it } from 'vitest'
import { calculateEmi } from './calculations'
import { simulateLoan } from './loanEngine'
import type { Loan, TimelineEvent } from '../types'

const base: Loan = { id: 'x', name: 'Test', bankName: 'Bank', loanType: 'floating', amount: 1_000_000, startDate: '2025-01-01', tenureMonths: 120, initialRate: 8, scheduledEmi: calculateEmi(1_000_000, 8, 120), actualEmi: calculateEmi(1_000_000, 8, 120), processingFee: 0, insuranceCharges: 0 }
const run = (events: TimelineEvent[] = []) => simulateLoan(base, events)
describe('daily reducing amortization engine', () => {
  it('creates a fully paid baseline schedule', () => { const result = run(); expect(result.isClosed).toBe(true); expect(result.rows.at(-1)?.closingBalance).toBe(0); expect(result.rows.length).toBeLessThanOrEqual(121) })
  it('splits mid-month interest across the old and new rate', () => { const r = run([{ id:'r', type:'rate-change', date:'2025-01-16', rate: 12 }]); const expected = 1_000_000 * .08 / 365 * 15 + 1_000_000 * .12 / 365 * 16; expect(r.rows[0].interest).toBeCloseTo(expected, 1) })
  it('reduces tenure after multiple prepayments', () => { const r = run([{id:'a',type:'prepayment',date:'2026-01-01',amount:100000,strategy:'reduce-tenure'}, {id:'b',type:'prepayment',date:'2027-01-01',amount:100000,strategy:'reduce-tenure'}]); expect(r.rows.length).toBeLessThan(run().rows.length); expect(r.totalExtra).toBe(200000) })
  it('reacts to EMI increases and decreases', () => { const up = run([{id:'e',type:'emi-change',date:'2025-02-01',amount:15000}]); const down = run([{id:'e',type:'emi-change',date:'2025-02-01',amount:9000}]); expect(up.rows.length).toBeLessThan(run().rows.length); expect(down.rows.length).toBeGreaterThan(run().rows.length) })
  it('keeps tenure and reduces EMI for reduce-emi prepayment', () => { const r = run([{id:'p',type:'prepayment',date:'2026-01-01',amount:150000,strategy:'reduce-emi'}]); expect(r.rows[12].emi).toBeLessThan(base.actualEmi); expect(r.rows.length).toBeLessThanOrEqual(base.tenureMonths + 1) })
  it('handles a zero balance / early closure', () => { const r = run([{id:'all',type:'prepayment',date:'2025-01-01',amount:1_000_000,strategy:'reduce-tenure'}]); expect(r.rows[0].closingBalance).toBe(0); expect(r.rows.length).toBe(1) })
  it('applies rate increases and decreases from their effective date', () => { const up = run([{id:'up',type:'rate-change',date:'2025-02-01',rate:12}]); const down = run([{id:'down',type:'rate-change',date:'2025-02-01',rate:6}]); expect(up.totalInterest).toBeGreaterThan(run().totalInterest); expect(down.totalInterest).toBeLessThan(run().totalInterest) })
})
